# Mobile Checkout Flow — Reversal Plan

**Status:** proposed, not yet applied. Nothing in this document has been implemented.
**Written:** 2026-09-18
**Precondition:** the mobile (Flutter) app can now be changed. Every step below depends on that.

---

## 1. Why this document exists

Between roughly 2026-08-24 and 2026-09-11 the mobile app could not be modified. The app's
call order did not match the backend's assumptions, so the backend absorbed the mismatch
with a set of deliberately-marked temporary workarounds:

* the app **charged the customer before the order existed**, so payments arrived with no
  `orderId` and no `installmentPlanId` to attach to;
* the app **asserted payment state directly** (`PUT /orders/{id}/status?status=PAYMENT_CONFIRMED`,
  `PUT /orders/{id}/payment?isPaid=true`) as soon as a *down payment* cleared, meaning
  "that charge went through", not "the plan is settled";
* the app **never carried the delivery fee** into its payment call, because there was no
  order to hang an address on.

Each workaround guesses. They are conservative and they log, but they are guesses, and
they are the reason a customer who paid 50% once showed 0% on every admin screen.

Now that the mobile code is reachable, the guessing can be deleted. This document lists
exactly what to remove in the backend, what the mobile must do instead, what the web
frontend needs, and the order the three must ship in.

---

## 2. The rule being restored

> **The order exists before any money moves, and every payment names what it is paying for.**

Two corollaries the mobile app must honour:

1. **No payment is ever initialized without an `orderId`.** The generic
   `POST /api/payments/{card,bank-transfer,bank}/initialize` endpoints stay for wallet
   top-ups only.
2. **No client ever asserts "paid".** The backend derives paid state from payment
   evidence. The app reads state back; it does not write it.

### Why order-first, when the current installment flow is plan-first

The backend **already supports order-first for installments today** — no backend change is
needed to enable it:

* `OrderService.checkout` does not require `plan.downPaymentPaid`, so an order can be
  created against a plan whose down payment has not been collected yet.
* `PaymentGatewayService.resolveOrderChargeAmount` and `OrderService.payOrderByWallet`
  both already compute the correct charge for an installment order whose down payment is
  still outstanding: `plan.downPayment + outstanding delivery fee`.

So one consistent rule covers both payment types, and the largest group of workarounds
(everything that exists to guess *which* plan or order an orphaned payment belongs to)
becomes dead code.

**The trade-off, stated plainly:** `OrderService.checkout` decrements branch stock. Under
order-first, a customer who abandons the payment screen leaves an unpaid order holding
stock. There is currently **no** `@Scheduled` job anywhere in the backend and **no**
automatic restock on cancellation, so today that stock is held indefinitely. Section 7 is
therefore not optional.

---

## 3. Target mobile flows

### 3.1 Installment purchase

| # | Call | Notes |
|---|---|---|
| 1 | `POST /api/installments/calculate` | Preview only, nothing saved. Optional. |
| 2 | `POST /api/installments` | Persists the plan, returns `planId`. Idempotent — re-submitting an unchanged cart/duration/destination returns the existing plan with HTTP 200 instead of creating a duplicate. |
| 3 | `POST /api/orders/checkout` | `paymentType: "INSTALLMENT"`, `installmentPlanId: <planId>`, plus `fulfillmentType` and the delivery fields. Returns the order. **Order now exists.** |
| 4 | `POST /api/orders/{orderId}/pay/card?callbackUrl=...` **or** `POST /api/orders/{orderId}/pay/wallet` | Backend charges `downPayment + outstanding delivery fee`, server-computed. Do not send an amount. |
| 5 | `GET /api/payments/verify/{reference}` | Card only, and only if you do not want to wait for the Paystack webhook. |
| 6 | `POST /api/installments/{planId}/pay-next/wallet` | Each later installment. Resolves the next due row server-side. |
| — | `POST /api/installments/{planId}/pay-full/wallet` | Optional: settle every remaining installment in one debit. |

`callbackUrl` on step 4 is a **query parameter**, not a body field.

### 3.2 One-off purchase

| # | Call | Notes |
|---|---|---|
| 1 | `POST /api/orders/checkout` | `paymentType: "FULL_PAYMENT"`. Returns the order. |
| 2 | `POST /api/orders/{orderId}/pay/card?callbackUrl=...` **or** `POST /api/orders/{orderId}/pay/wallet` | Backend charges `order.grandTotal`. |
| 3 | `GET /api/payments/verify/{reference}` | Card only. |

Nothing else. No status call, no payment-flag call.

### 3.3 Enum values, exactly

`PaymentType` (what checkout accepts): `FULL_PAYMENT`, `INSTALLMENT`, `WALLET`.
`FulfillmentType`: `DELIVERY`, `PICKUP`.

`ONE_OFF` is **not** a `PaymentType` — it is a `SalesOrderType` on the admin-side mirror
table. Sending `"ONE_OFF"` to checkout will fail validation. Use `FULL_PAYMENT`.

### 3.4 Calls the mobile must stop making

| Stop calling | Why | Call instead |
|---|---|---|
| `PUT /api/orders/{id}/status?status=PAYMENT_CONFIRMED` | The app fires it when a *down payment* clears. Taken at face value it stamped 100% on a plan with 4 of 5 installments outstanding (production, 2026-09-10, `sales_order` 4). | Nothing. The payment endpoints set status themselves. |
| `PUT /api/orders/{id}/payment?isPaid=true` | Same root cause. Flipping `order.isPaid` also blocks every *remaining* payment — both `payOrderByWallet` and `initializeCardPayment` refuse an order already flagged paid. | Nothing. |
| `POST /api/payments/card/initialize` (and `bank-transfer`/`bank`) **without `orderId`**, for a purchase | Leaves `Payment.orderId` and `Payment.installmentPlanId` both null — permanently orphaned unless the backend guesses. | `POST /api/orders/{orderId}/pay/card` |
| Embedding `Payment Reference: PM-XXXXXXXX` in `CheckoutDto.notes` | A workaround for paying before checkout. Under order-first there is nothing to adopt. | Nothing — the payment is already linked. |
| `POST /api/installments/{planId}/pay/wallet` using a **plan** id | `{installmentId}` on that route is an individual installment row id. Passing a plan id is what produced `403 "This installment does not belong to the requesting user"`. | `POST /api/installments/{planId}/pay-next/wallet`, which takes a plan id by design. |

### 3.5 How to display an installment plan

From `InstallmentPlanResponseDto`:

* `downPayment` — one period's payment. **It IS installment #1 of the schedule**, not a
  charge on top of it.
* `numberOfInstallments` — the duration the customer selected. A 4-month plan reports
  **4**, covering the down payment plus 3 remaining. Do not subtract one.
* `deliveryFee` — charged once, in full, with the first payment. Never financed.
* `firstPaymentAmount` = `downPayment + deliveryFee` — show this for period #1.
* `installmentAmount` — show this for every other period.
* `totalPayable` = `grandTotal + deliveryFee`.

**Do not divide `totalPayable` by `numberOfInstallments`.** That spreads the delivery fee
across the months, which is exactly what this breakdown exists to prevent.

`plan.installments` contains all `numberOfInstallments` rows. Row #1 flips to `PAID` when
the down payment is collected.

---

## 4. Backend: what to remove

Ordered by the mobile change that unblocks each one. Do not delete anything in this table
until the corresponding mobile build is live and verified — see section 6.

### Group A — unblocked by "mobile always sends `orderId`"

| # | Location | What it is | Action |
|---|---|---|---|
| A1 | `PaymentGatewayService.resolveOrphanedOrderPayment` (~line 1452) | Guesses which open one-off order an unlinked payment belongs to, by amount, falling back to most-recent. | Delete the method and both call sites (~1047, ~1154). |
| A2 | `PaymentGatewayService.resolveOrphanedDownPaymentPlan` (~line 1375) | Same, for installment plans. Also force-sets `isInstallmentPayment=true` on the adopted payment. | Delete the method and both call sites (~1046, ~1153). |
| A3 | `OrderService.reflectPreCheckoutPayment` (~line 541) + `PRE_CHECKOUT_PAYMENT_REFERENCE` (~line 528) | Adopts a payment named in `CheckoutDto.notes` onto the new order. | Delete both, and the call site in `checkout` (~line 491). |
| A4 | `PaymentGatewayService.matchDownPaymentDeliveryFee` (~line 1301), `previouslyQuotedDeliveryFee` (~line 1259), `DownPaymentDeliveryFeeMatch` (~line 1173) | Recovers a delivery fee from a cache and folds it into an order-less charge. | Delete all three, plus the three identical `if (order == null)` blocks in `initializeCardPayment` (~190), `initializeBankTransferPayment` (~325) and `initializeBankPayment` (~450). |
| A5 | `DeliveryFeeQuoteService` — `recentQuotesByUserId`, `consumeRecentDeliveryFee`, `QUOTE_TTL`, `CachedQuote` | The in-memory cache A4 reads. Per-instance and not shared across a multi-instance deployment. | Delete the cache. **Keep the rest of the class** — `quoteDeliveryFee` is real pricing logic used by `InstallmentService.buildPlan` and `OrderService.calculateDeliveryFeeQuote`. |
| A6 | `OrderService.checkout` delivery-fee refund safety net (~lines 447-473) | Refunds a stale delivery fee that A4 wrongly folded into a PICKUP order's down payment. | Delete — it exists only to catch A4's mistakes. |

### Group B — unblocked by "mobile stops asserting paid state"

| # | Location | What it is | Action |
|---|---|---|---|
| B1 | `OrderService.isUnsettledInstallmentOrder` (~line 831) | True when an installment order's plan is still running. | Delete, with both call sites. |
| B2 | `OrderService.updateOrderStatus` — the `isUnsettledInstallmentOrder` branch (~line 883) | Downgrades a `PAYMENT_CONFIRMED` assertion to a progress refresh. | Delete the branch; call `syncFullPaymentCollected` unconditionally. |
| B3 | `OrderService.updatePaymentStatus` — the `isPaid && isUnsettledInstallmentOrder` branch (~line 999) | Ignores `isPaid=true`, records the reference, returns 200 so the app sees no error. | Delete the branch. |
| B4 | `MobileSalesOrderSyncService.syncFullPaymentCollected` — the `hasOutstandingRepaymentEntries` guard (~line 349) | Refuses to mark a mirror fully paid while repayment entries are unpaid. | **Keep.** See the note below. |

**On B4 — deliberately keep it.** It is labelled a temporary workaround, but it is the
single choke point all four "mark it fully paid" callers pass through, and it derives
truth from the repayment schedule rather than trusting the caller. Once B1-B3 are gone it
should never fire; leave it in place as an assertion, and treat any log line from it as a
regression. If you would rather not keep dead code, convert it to throw instead of
silently refusing — but do not simply delete it.

### Group C — decide explicitly

| # | Location | What it is | Action |
|---|---|---|---|
| C1 | `PaymentGatewayService.initializeDownPaymentBankTransfer` (~line 668) and `initializeDownPaymentCard` (~line 790), routed at `POST /api/installments/{planId}/pay-down-payment/{bank-transfer,card}` | The *correct* plan-first endpoints — explicit `planId`, no guessing. Under order-first they become unused. | Either **remove** them along with `InitializeDownPaymentDto` and `resolveDownPaymentDeliveryFee`, or **keep** them as the supported plan-first path. Pick one and write it down; do not leave it ambiguous. |
| C2 | `OrderService.checkout` — the `installmentPlan.getDownPaymentPaid()` reflection branch (~lines 439-446) | Reflects a down payment collected *before* checkout onto the new order. | Needed only if C1 keeps the plan-first endpoints. Delete it if C1 removes them. |
| C3 | `InstallmentService.createInstallmentPlan` idempotency block (~lines 128-143) | Reuses a matching open plan instead of creating a duplicate. Added to stop duplicate plans defeating A2's matching. | **Keep.** A2 is gone, but the behaviour is independently correct — it stops a network retry or a back-and-re-enter from littering duplicate plans. |
| C4 | `InstallmentService.java` line ~243 comment | Says the count is *"the full schedule length BEFORE buildPlan peels off period #1"*. Describes a design that was rejected — `buildPlan` no longer peels anything off. | Fix the comment. Unrelated to the mobile change; do it now. |
| C5 | `installment-order-creation-timing.md` | Pre-dates the down-payment redesign; documents order creation at step 4 of the plan-first flow. | Rewrite or delete once the cutover lands. |

### Not a workaround — leave alone

* `OrderService.assertPaymentBacksConfirmation` — refuses to move an order into a paid
  state with no payment evidence. This is the guard that closed the original hole; it is
  a no-op for every legitimate flow.
* `InstallmentService.buildPlan` down-payment semantics — the current behaviour is the
  agreed design, corrected twice. Do not revisit.
* `MobileSalesOrderSyncService.createMirror` two-argument signature — a `paymentType`
  parameter was tried and removed on purpose. Deriving `isPaid` from the *chosen method*
  marked every `FULL_PAYMENT` order paid at placement and then made the real payment get
  swallowed by the already-paid guard.

---

## 5. Frontend (web admin)

**Nothing to revert.** No workaround for the mobile flow was ever added to `frontend/src`;
the compensation all lives in the backend.

Two things to do:

1. **Keep** the Credit Sales duration gate —
   `frontend/src/components/Orders/Sales/WalkIn/CreditSales/CreditSales.jsx:1797-1800`.
   Changing "Duration (months)" clears `generatedSchedule`, which re-locks **MAKE PAYMENT**
   until **GENERATE REPAYMENT SCHEDULE** is run again (`canPayFirstInstallment`, line 1890).
   This is walk-in credit sales, independent of the mobile flow, and it stays.
2. **Verify after cutover** that these screens show correct figures for a fresh mobile
   order, since they read the mirror that the deleted workarounds were propping up:
   * Order Tab → Ordering → Order Action → **Marking as paid**
   * Order Tab → Ordering → Order Action → **Order list as paid**
   * **Completed payments**
   * **One-off orders** (`GET /api/sales/orders/mobile-paid-in-full`)

---

## 6. Cutover order

Deleting backend workarounds before the mobile build is live **will break production
payments**. Ship in this order:

1. **Mobile first.** Build and release the new flow (section 3). The backend tolerates it
   already — order-first works today with no backend change. Both old and new app versions
   function during this window.
2. **Wait for adoption.** Old app versions still in the field depend on the workarounds.
   Do not proceed until the old version is below whatever floor you set, or is force-upgraded.
3. **Watch the logs.** Every workaround logs on the path being removed. Grep for
   `TEMP WORKAROUND`, `WORKAROUND:`, `Refused to mark mirrored installment order`, and
   `Ignoring isPaid=true for order`. When a full business cycle passes with none of these
   firing, the workarounds are provably unreached.
4. **Then delete**, Group A → Group B → Group C, compiling and verifying between groups.
5. **Add the stock-hold mitigation (section 7) before or with step 1**, not after.

Step 3 is the gate. Do not skip it — it is the only evidence that no live client still
depends on the code being removed.

---

## 7. Required companion work: stock held by unpaid orders

Order-first means `OrderService.checkout` decrements branch stock before any money is
collected. Today nothing releases it: there are no `@Scheduled` jobs in the backend, and
cancelling an order does not restock.

Minimum viable mitigation, needed before the mobile flow goes live:

* A scheduled job that finds orders in `PENDING` with `isPaid = false`, no completed
  `Payment`, and (for installments) `downPaymentPaid = false`, older than a chosen window
  — 30 to 60 minutes is the usual shape — then cancels them and returns the stock to
  `Stock.quantity` for the order's branch.
* The same restock path should run when an order is cancelled through
  `PUT /api/orders/{orderId}/cancel`.
* Mirror the cancellation onto the `SalesOrder` so the admin screens agree.

This is a genuine scope addition, not a detail. If it cannot be scheduled alongside the
mobile work, keep the plan-first flow for installments (C1: keep the down-payment
endpoints) and apply order-first to one-off purchases only — one-off orders are paid
within seconds of checkout, so the exposure window is small.

---

## 8. Verification

Run after each cutover step, for one installment order and one one-off order.

```sql
SELECT so.id, so.reference_no, so.order_type, so.is_paid, so.payment_progress,
       so.status, so.created_at, so.paid_at, so.total_amount,
       o.payment_type, o.installment_plan_id
FROM sales_orders so
JOIN orders o ON o.id = so.mobile_order_id
WHERE so.mobile_order_id = <order id>;
```

```sql
-- No payment should ever be orphaned again.
SELECT id, payment_reference, amount, status, order_id, installment_plan_id,
       is_installment_payment, created_at
FROM payments
WHERE order_id IS NULL
  AND installment_plan_id IS NULL
  AND status = 'COMPLETED'
  AND created_at > '<cutover date>';
```

Expected results:

| Scenario | `orders.is_paid` | `sales_orders.is_paid` | `sales_orders.payment_progress` | `installment_plans.status` |
|---|---|---|---|---|
| One-off, checkout only | 0 | 0 | 0 | — |
| One-off, paid | 1 | 1 | 100 | — |
| Installment 3-month, checkout only | 0 | 0 | 0 | ACTIVE |
| Installment, down payment paid | 0 | 0 | 33.33 | ACTIVE |
| Installment, 2 of 3 paid | 0 | 0 | 66.67 | ACTIVE |
| Installment, fully paid | 1 | 1 | 100 | COMPLETED |

Also confirm for a 4-month plan that `installment_plans.number_of_installments = 4`, that
`installments` holds 4 rows, and that row #1 is `PAID` immediately after the down payment.

The second query returning any row means a client is still paying without an `orderId`.

---

## 9. Rollback

Each group in section 4 is independent and additive-in-reverse — restoring a deleted
method and its call sites restores the old tolerance. Tag the commit before each group so
a single group can be reverted without disturbing the others. Group A is the one to revert
first if orphaned payments reappear.

---

## 10. Source references

* `backend/src/main/java/com/appGate/orderingsales/service/OrderService.java` — `checkout`, `payOrderByWallet`, `updateOrderStatus`, `updatePaymentStatus`
* `backend/src/main/java/com/appGate/account/service/PaymentGatewayService.java` — the initialize/verify/webhook paths and every orphan resolver
* `backend/src/main/java/com/appGate/account/service/InstallmentService.java` — `buildPlan`, `createInstallmentPlan`, `payNextInstallmentByWallet`
* `backend/src/main/java/com/appGate/orderingsales/service/MobileSalesOrderSyncService.java` — the admin-facing mirror
* `backend/src/main/java/com/appGate/orderingsales/service/DeliveryFeeQuoteService.java` — delivery pricing and the cache to remove
* `backend/src/main/java/com/appGate/account/controller/InstallmentController.java` — endpoint-level flow documentation
* `frontend/src/components/Orders/Sales/WalkIn/CreditSales/CreditSales.jsx` — walk-in credit sales schedule gate

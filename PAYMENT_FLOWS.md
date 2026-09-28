# Payment flows

How money is collected, and what the system records when it is. Four flows:

| # | Flow | Who | Where |
|---|---|---|---|
| 1 | [Online one-off](#1-online-one-off-full_payment) | Customer | Mobile app |
| 2 | [Online installment](#2-online-installment) | Customer | Mobile app |
| 3 | [Counter one-off](#3-counter-one-off-walk-in-cash-sale) | Cashier, customer present | Web app |
| 4 | [Counter installment](#4-counter-installment-walk-in-credit-sale) | Cashier, customer present | Web app |

The two sides differ in one fundamental way, and most of the rest follows from it:

- **Online is order-first.** The order exists before any money moves, so every payment carries the id of what it is paying for.
- **Counter is payment-first.** The sale is created only once Paystack confirms the money, because the cashier is standing with the customer and nothing should exist if they walk away.

Two record types, easily confused: `Order` is a mobile-app order; `SalesOrder` is an admin/counter sale (and a mirror of each mobile order, so admin screens can see it).

---

## 1. Online one-off (`FULL_PAYMENT`)

### Step 1 — the order

`POST /api/orders/checkout` → `OrderService.checkout`

Creates the `Order` and its items, prices it server-side, and **decrements stock** under a row lock. Online orders are booked to the **Head Office** branch.

The cart is deliberately **not** cleared here. Checkout happens before payment, so clearing it would cost a customer who abandons the payment screen both their basket and the stock it holds.

If the customer never pays, `AbandonedOrderReaper` cancels the order after `orders.abandoned.timeout-minutes` (default 120) and **returns the stock**. It leaves alone any order with a payment that completed, or a pending attempt newer than the cutoff.

### Step 2 — the payment

The app then calls one of four endpoints. The amount always comes from the order, never from the app.

| Option | Endpoint | Paystack channel |
|---|---|---|
| Card | `POST /api/orders/{orderId}/pay/card?callbackUrl=…` | `card` |
| Bank | `POST /api/payments/bank/initialize` + `orderId` | `ussd` |
| Bank transfer | `POST /api/payments/bank-transfer/initialize` + `orderId` | `bank_transfer` |
| PM Wallet | `POST /api/orders/{orderId}/pay/wallet` | — settles immediately |

Each gateway option creates a `Payment` row (`PENDING`, reference `PM-XXXXXXXX`) **already linked to the order**, and retires any older pending attempt on that order so one order cannot carry several live Paystack transactions.

### Step 3 — settlement

Two independent paths, and either can be first:

- **Verify** — `GET /api/payments/verify/{reference}`, which the app polls every 5 seconds while the Paystack page is open.
- **Webhook** — `POST /api/payments/webhook`, called by Paystack.

Both reach `markOrderPaid`, which sets `isPaid`, `PAYMENT_CONFIRMED` and the payment reference, posts the GL journal, clears the cart, and syncs the admin-side `SalesOrder`. It is idempotent per payment reference, so repeat polling changes nothing.

> **A charge still in flight is not a failure.** Paystack reports `ongoing`, `pending` or `abandoned` for a transaction that has not settled. Those leave the payment `PENDING` for the next verify or the webhook to resolve; only `failed` and `reversed` mark it `FAILED`. The app shows "Confirming Payment" with a **Check Again** button, never a false failure.

**GL:** Dr branch Paystack GL, Cr branch Sales GL. Wallet payments instead Dr Head Office Customer Wallet, Cr branch Sales.

---

## 2. Online installment

### Step 1 — the plan

`POST /api/installments/calculate` previews, `POST /api/installments` saves it.

The server prices the cart, adds 10% insurance (optional: the app sends `includeInsurance`, and leaving it out means insurance is added), and splits the total into periods counted on the real calendar from today up to today + N months: **monthly = 1 per month, weekly = the full weeks in that span (e.g. 13 for 3 months), daily = the days in that span**. Period #1 *is* the down payment, not an extra charge on top.

The app sends the delivery destination with the plan, so the delivery fee is priced server-side. **Delivery is spread over the first 50% of the payments**: it is split evenly across the installments that make up the first half of the plan (`InstallmentDeliveryFeeSpread`, half rounded up), and each of those rows' `amountDue` includes its share (`deliveryFeePortion`). E.g. a ₦100,000 item over 4 months with ₦3,000 delivery: months 1–2 are ₦26,500, months 3–4 are ₦25,000. Checkout re-spreads the fee if the order's real delivery fee differs from the plan's quote.

### Step 2 — the order

Same `POST /api/orders/checkout`, with `installmentPlanId`. Stock is decremented here too, and the plan is linked to the order both ways.

### Step 3 — the down payment

The same four options as flow 1, on the same endpoints. The amount is computed server-side as:

```
down payment + installment #1's delivery share
```

The remaining delivery shares are collected by installments #2 onwards as part of their own `amountDue`.

On settlement, `applyDownPaymentCollected` marks the plan's down payment paid, marks **installment #1 PAID**, and increments the completed count. The order deliberately stays `PENDING` and `isPaid = false` — the plan is not settled yet.

> **One-period plans** (monthly, 1 month) are settled outright by the down payment. The order is marked paid at that point, because no installment remains to trigger it later.

### Step 4 — the repayments

**Wallet only.** A customer with an empty wallet must fund it via Paystack first — there is no card or bank repayment path.

| Action | Endpoint |
|---|---|
| Pay the next installment | `POST /api/installments/{planId}/pay-next/wallet` |
| Pay off the plan | `POST /api/installments/{planId}/pay-full/wallet` |
| Pay one specific installment | `POST /api/installments/{installmentId}/pay/wallet` |

Each repayment debits the wallet under a row lock, writes a `Payment` linked to the plan, installment, order and branch, marks the installment PAID, and refreshes the plan's remaining balance and next due date. **Overdue installments are collected alongside pending ones**, so a missed payment cannot be skipped past. When the last one is paid, the plan completes and the order is marked paid.

Both endpoints refuse a plan with no order: paying "the next installment" on such a plan would collect the down payment without recording it as such, and checkout would then charge it again.

`InstallmentOverdueScanner` runs daily and marks missed installments `OVERDUE` with a day count.

**GL per repayment:** Dr Head Office Customer Wallet, Cr the order branch's Sales GL.

---

## 3. Counter one-off (walk-in cash sale)

The cashier builds a basket on the web app and takes payment through Paystack.

### Step 1 — collect first

`POST /api/sales/walk-in/cash/initialize-payment`

**No sale exists yet.** The basket travels inside Paystack's own metadata. The customer pays in a popup.

The discount field is entered as a **percentage** and converted to a naira amount before it is sent, because the server subtracts it as an amount. (Sending the raw percentage made the charge and the server's expected total disagree, so a discounted sale took the money and created nothing.)

### Step 2 — verify, then create

`GET /api/sales/walk-in/cash/verify-payment/{reference}`

Only after Paystack confirms, and only if the amount collected covers the basket, the server creates one `SalesOrder` per line, marks each paid, sets them to `PROCESSING` (skipping the manual approval queue — the money is already in), records a `Payment` against each with the gateway reference, and **decrements branch stock**.

If stock is short at this point the sale is still recorded and a shortfall is logged: the customer has already paid, so refusing the sale would take their money and hand over nothing.

Re-verifying the same reference returns the existing orders rather than creating duplicates.

**GL:** Dr branch Paystack GL, Cr branch Sales GL.

### Settling without the gateway

Cash in the drawer or a transfer confirmed by the cashier is recorded by `PUT /api/sales/orders/{orderId}/mark-paid` (gated at ≥50% paid where a schedule exists) or `PUT /api/sales/orders/{orderId}/settle-one-off`. Both now write a `Payment` row marked as an off-system settlement, so "orders marked paid" can be reconciled against money received. Neither may be used on a mobile-channel order — those are paid off in the app.

---

## 4. Counter installment (walk-in credit sale)

### Step 1 — first installment, collected first

`POST /api/sales/credit/first-installment/initialize-payment` → customer pays in the popup → `GET /api/sales/credit/first-installment/verify-payment/{reference}`

On confirmation the server creates the `SalesOrder` with its loan details, generates the repayment schedule, records the `Payment`, and marks entry #1. If the amount collected is short of what was due, the entry is marked `PARTIAL` and the shortfall logged, rather than being called paid in full.

**GL:** Dr branch Paystack GL, Cr branch Sales GL.

### Step 2 — later repayments

From the order screens, "Pay Installment" opens a Paystack popup:

`POST /api/sales/orders/{orderId}/installment-payment/initialize` → `GET /api/sales/orders/installment-payment/verify/{reference}`

The amount is priced server-side from the next `PENDING`/`OVERDUE` entry and is rejected if it does not cover it. On success the entry is marked PAID, payment progress recalculated, the order marked fully paid once the schedule is complete, and the journal posted.

The popup closing no longer counts as success — the server is asked what actually happened, so an abandoned checkout reports as unconfirmed.

Restricted to walk-in sales: a mobile-channel order cannot be paid here, because that would flip the admin mirror while the app still shows the balance owed.

### Funding a walk-in customer's wallet

`POST /api/cashier/wallet/initialize-paystack-checkout` → `GET /api/cashier/wallet/verify-funding/{reference}`

The credit is recorded under `FUND-<reference>`, a unique key, so the cashier's callback and the Paystack webhook cannot both credit it. Where the walk-in customer is also an app user (matched on email), the money lands in the wallet they actually spend from.

**GL:** Dr Head Office Paystack GL, Cr Head Office Customer Wallet GL.

---

## Cross-cutting

**The webhook is authenticated by signature.** `POST /api/payments/webhook` is public, so the `x-paystack-signature` HMAC is the only thing between a stranger and "mark any order paid". An unsigned or mis-signed call is ignored, and still answered 200. `paystack.secret.key` must be the key the transactions were created with; set `paystack.webhook.verify-signature=false` only for local testing.

Counter flows settle on their own verify call and do not depend on the webhook. The exception is cashier **bank transfer** funding, where the payer may finish after the cashier has left the callback page — there the webhook is the safety net.

**Nothing is adopted by guesswork.** A payment with no `orderId` and no `installmentPlanId` is a wallet top-up or a direct payment, and is never attached to anybody's order or plan.

**Idempotency keys**

| What | Key |
|---|---|
| Order settlement | payment reference vs `order.paymentReference` |
| GL journals | `GL-SALE-` / `GL-WFUND-` / `GL-WPAY-` / `GL-FT-` + reference |
| Wallet funding credit | `FUND-<paymentReference>` (unique column) |
| Counter sale creation | the Paystack reference |

**GL postings at a glance**

| Event | Debit | Credit |
|---|---|---|
| Paystack purchase (any flow) | Branch Paystack | Branch Sales Revenue |
| Wallet funded via Paystack | Head Office Paystack | Head Office Customer Wallet |
| Paid from wallet | Head Office Customer Wallet | Branch Sales Revenue |
| Fund transfer to a wallet | The company account chosen | Head Office Customer Wallet |

GLs are mapped per branch on the **Account Details** page by tagging a purpose (Paystack, Sales Revenue, Customer Wallet). A missing mapping logs an error and skips the journal — the payment still succeeds, so the log is the only signal.

**Open accounting question:** installment revenue is recognised as each repayment is collected, with no receivable, and the 10% insurance is booked to sales revenue. Totals reconcile; period allocation does not. Unchanged pending a decision.

package com.appGate.orderingsales.service;

import com.appGate.account.models.Installment;
import com.appGate.account.models.InstallmentPlan;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.orderingsales.enums.CustomerType;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.NotificationType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.SalesOrderType;
import com.appGate.orderingsales.models.LoanDetails;
import com.appGate.orderingsales.models.LoanRepaymentEntry;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.models.SalesNotification;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.LoanDetailsRepository;
import com.appGate.orderingsales.repository.LoanRepaymentEntryRepository;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesNotificationRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Mirrors the mobile-app {@link Order} / {@link InstallmentPlan} / {@code Payment} domain onto
 * a shadow {@link SalesOrder} (+ {@link LoanDetails}/{@link LoanRepaymentEntry} for installment
 * orders), because the admin "Orderlist" / "Mark as Paid" screens (OrderListPaid.jsx, the
 * orderlist notification list, /api/sales/orders/incomplete-payments etc.) only ever read the
 * SalesOrder model - they have no idea the mobile Order/Payment/InstallmentPlan tables exist.
 * Without this, a part-payment made from the mobile app is recorded correctly but is invisible
 * on every admin payment-tracking screen.
 *
 * <p>The synchronous, customer-facing entry points ({@link #createMirror},
 * {@link #syncDownPaymentCollected}, {@link #syncInstallmentPaid}, and
 * {@link #syncFullPaymentCollected}) throw on failure and join the caller's existing
 * transaction (checkout / wallet payment / installment payment), so a sync failure rolls
 * back the whole customer-facing operation instead of silently leaving the admin side
 * blind - this is what actually happened in a real incident (a customer's mobile app
 * showed a payment as made while every admin screen showed 0%, with nothing in the logs
 * pointing at why). The caller gets a clean error and the customer can retry.
 *
 * <p>The one exception is {@link #syncFullPaymentCollectedIsolated} and
 * {@link #syncDownPaymentCollectedIsolated}, used only from the Paystack webhook/verify
 * path ({@code PaymentGatewayService.markOrderPaid}) - that path must never fail to
 * acknowledge Paystack (a webhook is expected to always return 200), so those variants
 * run in their own separate transaction and swallow their own failures, exactly like
 * every method here used to. A real Paystack charge is never rolled back just because
 * the admin-facing mirror couldn't be updated.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MobileSalesOrderSyncService {

    private final SalesOrderRepository salesOrderRepository;
    private final LoanDetailsRepository loanDetailsRepository;
    private final LoanRepaymentEntryRepository loanRepaymentEntryRepository;
    private final SalesNotificationRepository salesNotificationRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RiderRepository riderRepository;
    private final RiderBoxRepository riderBoxRepository;

    /**
     * Creates the shadow SalesOrder right after OrderService.checkout() saves the mobile Order
     * (and, for INSTALLMENT orders, links the InstallmentPlan onto it). For installment orders
     * this also creates a LoanDetails shadow with one LoanRepaymentEntry per installment -
     * entry #1 is the plan's down payment (see InstallmentService.buildPlan), collected
     * separately via OrderService.payOrderByWallet/PaymentGatewayService, not at checkout time.
     *
     * <p>Joins the caller's (checkout's) transaction and throws on failure - an order that
     * can't be made visible to the admin side should not be allowed to succeed silently,
     * so OrderService.checkout() rolls back the whole order rather than placing one that
     * would vanish from every admin screen.
     */
    @Transactional
    public void createMirror(Order order, InstallmentPlan plan) {
        User user = userRepository.findById(order.getUserId()).orElse(null);
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        SalesOrder mirror = new SalesOrder();
        mirror.setMobileOrderId(order.getId());
        mirror.setReferenceNo("MOB-" + order.getOrderNumber());
        mirror.setOrderType(plan != null ? SalesOrderType.INSTALLMENT : SalesOrderType.ONE_OFF);
        mirror.setCustomerType(CustomerType.ONLINE);
        mirror.setChannel(com.appGate.orderingsales.enums.SalesChannel.MOBILE);
        mirror.setCustomerId(order.getUserId());
        mirror.setCustomerName(customerName(user));
        mirror.setEmail(user != null ? user.getEmail() : null);
        mirror.setPhoneNumber(user != null ? user.getPhoneNumber() : order.getDeliveryPhone());
        mirror.setAddress(order.getDeliveryAddress());
        mirror.setProductName(describeItems(items));
        mirror.setQuantity(totalQuantity(items));
        mirror.setStatus(OrderStatus.PENDING);
        // Nothing has been collected yet at checkout time. PaymentType.FULL_PAYMENT is the
        // method the customer picked, not evidence the money arrived - card/transfer are
        // confirmed later by PaymentGatewayService.markOrderPaid, wallet by
        // OrderService.payOrderByWallet. Deriving isPaid/paidAt/100% from it marked every
        // FULL_PAYMENT order paid the moment it was placed, and then made
        // syncFullPaymentCollected's already-paid guard swallow the real payment when it
        // landed - so the order never reached PAYMENT_CONFIRMED and no "payment confirmed"
        // notification was ever raised. The payment paths own that transition. The one thing
        // already collected at this point is an installment plan's pre-checkout down payment,
        // which installmentProgress reflects.
        mirror.setIsPaid(false);
        mirror.setPaidAt(null);
        mirror.setPaymentProgress(plan != null ? installmentProgress(plan) : BigDecimal.ZERO);
        mirror.setBranchId(order.getBranchId());
        // Without this, every mirror defaults to DELIVERY (see SalesOrder.fulfillmentType),
        // so a real PICKUP order would still wrongly surface in
        // findOrdersReadyForRiderAssignment.
        mirror.setFulfillmentType(order.getFulfillmentType());
        mirror.setTotalAmount(plan != null
                ? BigDecimal.valueOf(plan.getGrandTotal())
                : BigDecimal.valueOf(order.getGrandTotal()));

        SalesOrder saved = salesOrderRepository.save(mirror);

        if (plan != null) {
            createLoanShadow(saved, plan);
        }

        createNotification(saved, "New " + (plan != null ? "installment" : "online") + " order placed"
                + (saved.getCustomerName() != null ? " by " + saved.getCustomerName() : ""));
    }

    private void createLoanShadow(SalesOrder mirror, InstallmentPlan plan) {
        LoanDetails loan = new LoanDetails();
        loan.setSalesOrder(mirror);
        loan.setAccountNumber(mirror.getCustomerId() != null ? String.valueOf(mirror.getCustomerId()) : null);
        loan.setCustomerName(mirror.getCustomerName());
        loan.setLoanType("MOBILE_INSTALLMENT");
        loan.setProductAmount(BigDecimal.valueOf(plan.getTotalAmount()));
        loan.setRepaymentMethod(plan.getFrequency() != null ? plan.getFrequency().name() : null);
        loan.setDuration(plan.getNumberOfInstallments() + " x "
                + (plan.getFrequency() != null ? plan.getFrequency().name() : "installments"));
        loan.setInterestOnLoan(BigDecimal.valueOf(plan.getInsuranceAmount()));
        loan.setStartDate(plan.getStartDate());
        loan.setTotalRepayment(BigDecimal.valueOf(plan.getGrandTotal()));
        LoanDetails savedLoan = loanDetailsRepository.save(loan);

        // Entry #1 IS the plan's down payment (see InstallmentService.buildPlan) -
        // collected separately (and up front, together with delivery) via
        // OrderService.payOrderByWallet/PaymentGatewayService.applyDownPaymentCollected -
        // so this loop over plan.getInstallments() already covers it, no separate
        // synthetic entry needed.
        List<Installment> installments = plan.getInstallments();
        if (installments != null) {
            for (Installment installment : installments) {
                LoanRepaymentEntry entry = new LoanRepaymentEntry();
                entry.setLoanDetails(savedLoan);
                entry.setEntryNumber(installment.getInstallmentNumber());
                entry.setAmountDue(BigDecimal.valueOf(installment.getAmountDue()));
                entry.setDueDate(installment.getDueDate());
                entry.setStatus("PENDING");
                loanRepaymentEntryRepository.save(entry);
            }
        }
    }

    /**
     * Marks entry #1 (the down payment - see InstallmentService.buildPlan) paid once
     * OrderService.payOrderByWallet/PaymentGatewayService collects it. Joins the
     * caller's transaction and throws on failure - see the class javadoc.
     */
    @Transactional
    public void syncDownPaymentCollected(Long mobileOrderId) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId + " - cannot record the down payment"));
        LoanDetails loan = loanDetailsRepository.findBySalesOrderId(mirror.getId())
                .orElseThrow(() -> new RuntimeException(
                        "No LoanDetails shadow found for mobile order " + mobileOrderId + " - cannot record the down payment"));

        loanRepaymentEntryRepository.findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId()).stream()
                .filter(e -> e.getEntryNumber() == 1)
                .findFirst()
                .ifPresent(entry -> {
                    entry.setStatus("PAID");
                    entry.setPaidDate(LocalDate.now());
                    entry.setAmountPaid(entry.getAmountDue());
                    loanRepaymentEntryRepository.save(entry);
                });
        refreshProgress(mirror, loan);
    }

    /**
     * Isolated variant of {@link #syncDownPaymentCollected} for the Paystack webhook/verify
     * path - see the class javadoc for why this one still swallows its own failures.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncDownPaymentCollectedIsolated(Long mobileOrderId) {
        try {
            syncDownPaymentCollected(mobileOrderId);
        } catch (Exception e) {
            log.error("Failed to sync down payment for mobile order {} (webhook path - the payment itself was "
                    + "NOT rolled back, only this admin-visibility mirror update): {}", mobileOrderId, e.getMessage(), e);
        }
    }

    /**
     * Marks the installment's mirrored repayment entry paid once InstallmentService pays it
     * off, and closes out the mirror order once the whole plan is complete. Joins the
     * caller's transaction and throws on failure - see the class javadoc.
     */
    @Transactional
    public void syncInstallmentPaid(Long mobileOrderId, Installment installment, boolean planCompleted) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId + " - cannot record this installment payment"));
        LoanDetails loan = loanDetailsRepository.findBySalesOrderId(mirror.getId())
                .orElseThrow(() -> new RuntimeException(
                        "No LoanDetails shadow found for mobile order " + mobileOrderId + " - cannot record this installment payment"));

        loanRepaymentEntryRepository.findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId()).stream()
                .filter(e -> e.getEntryNumber().equals(installment.getInstallmentNumber()))
                .findFirst()
                .ifPresent(entry -> {
                    entry.setStatus("PAID");
                    entry.setPaidDate(LocalDate.now());
                    entry.setAmountPaid(BigDecimal.valueOf(installment.getAmountPaid()));
                    loanRepaymentEntryRepository.save(entry);
                });
        SalesOrder refreshed = refreshProgress(mirror, loan);

        if (planCompleted) {
            refreshed.setIsPaid(true);
            refreshed.setPaidAt(LocalDateTime.now());
            refreshed.setStatus(OrderStatus.PAYMENT_CONFIRMED);
            salesOrderRepository.save(refreshed);
            createNotification(refreshed, "Installment plan fully paid off by " + refreshed.getCustomerName());
        } else {
            createNotification(refreshed, "Installment payment received from " + refreshed.getCustomerName()
                    + " (" + refreshed.getPaymentProgress() + "% paid)");
        }
    }

    /**
     * Recomputes a mirrored installment order's payment progress from its repayment shadow,
     * leaving isPaid/paidAt/status alone. This is the right counterpart for the order-status /
     * payment-status endpoints the mobile app calls after a single installment is collected
     * (see the workaround note in {@link #syncFullPaymentCollected}) - the progress admins read
     * should move, the "fully paid" flags should not. A one-off order has no repayment shadow,
     * so this is a no-op for it. Joins the caller's transaction and throws on failure - see the
     * class javadoc.
     */
    @Transactional
    public void syncInstallmentProgress(Long mobileOrderId) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId
                                + " - cannot refresh payment progress"));
        loanDetailsRepository.findBySalesOrderId(mirror.getId())
                .ifPresent(loan -> refreshProgress(mirror, loan));
    }

    /**
     * True when the mirrored repayment schedule still holds an entry that isn't PAID. An empty
     * schedule says nothing either way and is deliberately not treated as outstanding, so a
     * shadow that never got its entries can't permanently block a legitimate full payment.
     */
    private boolean hasOutstandingRepaymentEntries(LoanDetails loan) {
        return loanRepaymentEntryRepository.findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId())
                .stream()
                .anyMatch(entry -> !"PAID".equals(entry.getStatus()));
    }

    /**
     * Mirrors a plain status transition (SHIPPED, DELIVERED, CANCELLED, etc.) from
     * OrderService.updateOrderStatus onto the SalesOrder mirror's own status field.
     * Use {@link #syncFullPaymentCollected} instead when the new status is
     * PAYMENT_CONFIRMED - that one also fixes up isPaid/paidAt/paymentProgress, which a
     * bare status write here would leave stale. Joins the caller's transaction and
     * throws on failure - see the class javadoc.
     */
    @Transactional
    public void syncOrderStatus(Long mobileOrderId, OrderStatus status) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId + " - cannot record this status change"));
        mirror.setStatus(status);
        salesOrderRepository.save(mirror);
    }

    /**
     * Marks a mobile order (and its SalesOrder mirror) delivered. This is the single place
     * every delivery-completion path (RiderBoxService.deliverProduct,
     * DeliveryOperationsService.confirmDelivery, TransitDeliveryService.markAsDelivered) should
     * call, so Order.orderStatus/Order.deliveryStatus and the mirrored SalesOrder.status never
     * fall out of sync with each other again - see this class's javadoc for why that mirror
     * matters. Joins the caller's transaction and throws on failure.
     */
    @Transactional
    public void markOrderDelivered(Long mobileOrderId) {
        Order order = orderRepository.findById(mobileOrderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + mobileOrderId));
        order.setOrderStatus(OrderStatus.DELIVERED);
        order.setDeliveryStatus(DeliveryStatus.DELIVERED);
        if (order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        orderRepository.save(order);
        syncOrderStatus(mobileOrderId, OrderStatus.DELIVERED);
    }

    /**
     * Dispatches a mobile order to a rider for OrderService.assignRider (the admin
     * "assign rider" action on an order). This used to only stamp Order.riderId/deliveryStatus,
     * but the rider's own app reads its pending deliveries off RiderBox (see
     * DeliveryOperationsService.getPendingDeliveries / RiderBoxService.assignProduct), which
     * that path never touched - so an order assigned this way silently never reached the
     * rider. This is now the one place that creates/reuses the RiderBox row, so both
     * admin entry points (this one and POST /api/admin/assign-product) leave a rider box
     * behind. Reuses a REJECTED box the same way RiderBoxService.assignProduct does, so a
     * previously-rejected order can be handed to a different rider. Joins the caller's
     * transaction and throws on failure - see the class javadoc.
     */
    @Transactional
    public void assignOrderToRider(Long mobileOrderId, Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found: " + riderId));

        // A previously REJECTED box is reused (handed to the new rider) instead of blocking
        // forever - otherwise a rejected delivery could never go to another rider. See the
        // matching comment in RiderBoxService.assignProduct.
        Optional<RiderBox> existingAssignment = riderBoxRepository.findByOrderId(mobileOrderId);
        if (existingAssignment.isPresent() && existingAssignment.get().getStatus() != RiderBoxStatusEnum.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order already assigned to a rider");
        }
        RiderBox riderBox = existingAssignment.orElseGet(RiderBox::new);

        riderBox.setOrderId(mobileOrderId);
        riderBox.setSalesOrderId(null);
        riderBox.setSaleRef(mobileOrderId);
        riderBox.setRider(rider);
        riderBox.setStatus(RiderBoxStatusEnum.PENDING);
        riderBoxRepository.save(riderBox);

        salesOrderRepository.findByMobileOrderId(mobileOrderId).ifPresent(mirror -> {
            mirror.setStatus(OrderStatus.ASSIGNED_TO_RIDER);
            salesOrderRepository.save(mirror);
        });
    }

    /**
     * Marks a full/one-off mobile order's mirror paid (card checkout or full wallet payment).
     * Refuses to do so for an installment order that still has unpaid repayment entries,
     * refreshing its progress instead - see the workaround note in the body. Joins the
     * caller's transaction and throws on failure - see the class javadoc.
     */
    @Transactional
    public void syncFullPaymentCollected(Long mobileOrderId) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId + " - cannot record this payment"));

        if (Boolean.TRUE.equals(mirror.getIsPaid())) {
            return;
        }

        // TEMPORARY WORKAROUND - remove once the mobile app stops calling
        // PUT /api/orders/{id}/status?status=PAYMENT_CONFIRMED (and PUT /api/orders/{id}/payment
        // ?isPaid=true) as soon as an installment plan's DOWN PAYMENT clears. To the app that
        // call means "that payment went through"; taken at face value it reaches here and stamps
        // isPaid/paidAt/100%/PAYMENT_CONFIRMED on the mirror while the rest of the plan is still
        // outstanding. Confirmed against production data (2026-09-10): sales_order 4 showed
        // 100% and PAYMENT_CONFIRMED with only installment #1 of 5 (9,900 of 49,500) collected,
        // every other installment still PENDING and the plan still ACTIVE.
        //
        // An installment order is fully paid only when every mirrored repayment entry is PAID,
        // so derive that here rather than trusting the caller. This is the single choke point
        // all four "mark it fully paid" callers go through (OrderService.updateOrderStatus /
        // updatePaymentStatus / payOrderByWallet and PaymentGatewayService.markOrderPaid), so
        // the guard cannot be routed around. syncInstallmentPaid still closes the order out
        // normally on the last installment.
        LoanDetails loan = loanDetailsRepository.findBySalesOrderId(mirror.getId()).orElse(null);
        if (loan != null && hasOutstandingRepaymentEntries(loan)) {
            SalesOrder refreshed = refreshProgress(mirror, loan);
            log.warn("Refused to mark mirrored installment order {} (sales order {}) fully paid - its "
                    + "repayment schedule still has unpaid entries. Refreshed payment progress to {}% "
                    + "instead. This means a caller reported a single installment as a full payment.",
                    mobileOrderId, refreshed.getId(), refreshed.getPaymentProgress());
            return;
        }

        mirror.setIsPaid(true);
        mirror.setPaidAt(LocalDateTime.now());
        mirror.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        mirror.setPaymentProgress(BigDecimal.valueOf(100));
        salesOrderRepository.save(mirror);
        createNotification(mirror, "Payment confirmed for order by " + mirror.getCustomerName());
    }

    /**
     * Isolated variant of {@link #syncFullPaymentCollected} for the Paystack webhook/verify
     * path - see the class javadoc for why this one still swallows its own failures.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncFullPaymentCollectedIsolated(Long mobileOrderId) {
        try {
            syncFullPaymentCollected(mobileOrderId);
        } catch (Exception e) {
            log.error("Failed to sync full payment for mobile order {} (webhook path - the payment itself was "
                    + "NOT rolled back, only this admin-visibility mirror update): {}", mobileOrderId, e.getMessage(), e);
        }
    }

    /**
     * Mirrors a customer's cancellation request (OrderService.requestCancellation) onto the
     * SalesOrder so it shows up on the sales "Cancelled Notifications" queue. Records the
     * mirror's current status as preCancellationStatus so the order can be restored to it if
     * sales or admin later rejects the request. Joins the caller's transaction and throws on
     * failure - see the class javadoc.
     */
    @Transactional
    public void syncCancellationRequested(Long mobileOrderId, String reason) {
        SalesOrder mirror = salesOrderRepository.findByMobileOrderId(mobileOrderId)
                .orElseThrow(() -> new RuntimeException(
                        "No SalesOrder mirror found for mobile order " + mobileOrderId + " - cannot record the cancellation request"));

        mirror.setPreCancellationStatus(mirror.getStatus());
        mirror.setStatus(OrderStatus.CANCELLATION_REQUESTED);
        mirror.setCancellationReason(reason);
        SalesOrder saved = salesOrderRepository.save(mirror);

        createNotification(saved, NotificationType.CANCELLED,
                saved.getCustomerName() + " requested to cancel order " + saved.getReferenceNo()
                        + " - click to review");
    }

    /**
     * For an installment order, the mobile app pays the plan's down payment BEFORE checkout
     * calls {@link #createMirror} (see OrderService.checkout) - so the plan itself, not any
     * LoanRepaymentEntry, is the only place that already-collected amount is recorded at this
     * point (checkout only marks entry #1's shadow paid afterwards, via
     * {@link #syncDownPaymentCollected}, once this mirror exists). Reflect it here so the
     * mirror starts out accurate instead of showing 0%/null until that follow-up call runs.
     */
    private BigDecimal installmentProgress(InstallmentPlan plan) {
        if (plan == null || !Boolean.TRUE.equals(plan.getDownPaymentPaid())) {
            return null;
        }
        BigDecimal grandTotal = BigDecimal.valueOf(plan.getGrandTotal());
        if (grandTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(plan.getDownPayment())
                .multiply(BigDecimal.valueOf(100))
                .divide(grandTotal, 2, RoundingMode.HALF_UP);
    }

    private SalesOrder refreshProgress(SalesOrder mirror, LoanDetails loan) {
        BigDecimal totalPaid = loanRepaymentEntryRepository.sumAmountPaidByLoanDetailsId(loan.getId());
        BigDecimal totalAmount = mirror.getTotalAmount();
        BigDecimal percentage = (totalAmount != null && totalAmount.compareTo(BigDecimal.ZERO) > 0)
                ? totalPaid.multiply(BigDecimal.valueOf(100)).divide(totalAmount, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        mirror.setPaymentProgress(percentage);
        return salesOrderRepository.save(mirror);
    }

    private String customerName(User user) {
        if (user == null) {
            return null;
        }
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String name = (first + " " + last).trim();
        return name.isBlank() ? user.getEmail() : name;
    }

    private String describeItems(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        if (items.size() == 1) {
            return items.get(0).getProductName();
        }
        return items.size() + " items (" + items.get(0).getProductName() + ", ...)";
    }

    private Integer totalQuantity(List<OrderItem> items) {
        if (items == null) {
            return 0;
        }
        return items.stream().mapToInt(OrderItem::getQuantity).sum();
    }

    private void createNotification(SalesOrder order, String message) {
        createNotification(order, NotificationType.ORDERLIST, message);
    }

    private void createNotification(SalesOrder order, NotificationType type, String message) {
        try {
            SalesNotification notification = new SalesNotification();
            notification.setSalesOrderId(order.getId());
            notification.setCustomerName(order.getCustomerName());
            notification.setNotificationType(type);
            notification.setMessage(message);
            salesNotificationRepository.save(notification);
        } catch (Exception e) {
            log.warn("Failed to create sales notification for mirrored order {}: {}", order.getId(), e.getMessage());
        }
    }
}

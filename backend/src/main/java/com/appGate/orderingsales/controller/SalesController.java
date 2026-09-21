package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.*;
import com.appGate.orderingsales.models.LoanDetails;
import com.appGate.orderingsales.models.SalesNotification;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    // ==================== ORDER CREATION ====================

    @PostMapping("/orders/one-off")
    public BaseResponse createOneOffOrder(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOneOffOrder(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/orders/installment")
    public BaseResponse createInstallmentOrder(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createInstallmentOrder(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/online/one-off")
    public BaseResponse createOnlineOneOffSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOnlineOneOffSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/online/credit")
    public BaseResponse createOnlineCreditSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOnlineCreditSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/walk-in/cash")
    public BaseResponse createWalkInCashSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createWalkInCashSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    // Starts a Paystack hosted checkout for a walk-in cash-sale cart (anonymous or
    // registered customer). On verified payment the sale is created immediately as
    // paid — see verifyWalkInCashPayment — bypassing the manual admin-approval queue
    // that the "/admin/approvals" CASH_SALES flow otherwise requires.
    @PostMapping("/walk-in/cash/initialize-payment")
    public BaseResponse initializeWalkInCashPayment(@RequestBody WalkInCashPaymentInitializeDto dto) {
        Map<String, Object> result = salesService.initializeWalkInCashPayment(dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // Verifies a Paystack payment on return and creates the paid SalesOrder(s) for the
    // cart carried through Paystack's metadata. Idempotent — safe to call again for the
    // same reference (e.g. on callback-page refresh).
    @GetMapping("/walk-in/cash/verify-payment/{reference}")
    public BaseResponse verifyWalkInCashPayment(@PathVariable String reference) {
        Map<String, Object> result = salesService.verifyWalkInCashPayment(reference);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    @PostMapping("/walk-in/credit")
    public BaseResponse createWalkInCreditSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createWalkInCreditSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    // Starts a Paystack hosted checkout for the first installment of a walk-in credit sale
    // that has not been submitted yet. On verified payment the order is created immediately —
    // see verifyCreditFirstInstallmentPayment.
    @PostMapping("/credit/first-installment/initialize-payment")
    public BaseResponse initializeCreditFirstInstallmentPayment(@RequestBody CreditFirstInstallmentPaymentInitializeDto dto) {
        Map<String, Object> result = salesService.initializeCreditFirstInstallmentPayment(dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // Verifies a first-installment Paystack payment on return and creates the walk-in credit
    // SalesOrder for the cart carried through Paystack's metadata. Idempotent — safe
    // to call again for the same reference (e.g. on callback-page refresh).
    @GetMapping("/credit/first-installment/verify-payment/{reference}")
    public BaseResponse verifyCreditFirstInstallmentPayment(@PathVariable String reference) {
        Map<String, Object> result = salesService.verifyCreditFirstInstallmentPayment(reference);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    @PostMapping("/orders/{orderId}/repayment-schedule")
    public BaseResponse generateRepaymentSchedule(@PathVariable Long orderId) {
        LoanDetails loanDetails = salesService.generateRepaymentSchedule(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", loanDetails);
    }

    @GetMapping("/loan/payment-options")
    public BaseResponse getCreditPaymentOptions() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", salesService.getCreditPaymentOptions());
    }

    @PostMapping("/loan/calculate-schedule")
    public BaseResponse calculateLoanSchedule(@RequestBody LoanScheduleCalculationDto dto) {
        java.util.Map<String, Object> schedule = salesService.calculateLoanSchedule(dto);
        return new BaseResponse(HttpStatus.OK.value(), "Loan schedule calculated successfully", schedule);
    }

    // Phase 3 of the order/SalesOrder unification: one-off backfill of OrderItem/
    // InstallmentPlan shadow rows for SalesOrders created before the Phase 2 dual-write
    // existed. Idempotent - safe to call more than once (only fills in what's missing).
    @PostMapping("/admin/backfill-order-item-installment-shadows")
    public BaseResponse backfillOrderItemAndInstallmentPlanShadows() {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.backfillOrderItemAndInstallmentPlanShadows());
    }

    // ==================== ORDER MANAGEMENT ====================

    @PutMapping("/orders/{orderId}/mark-paid")
    public BaseResponse markOrderAsPaid(@PathVariable Long orderId) {
        SalesOrder order = salesService.markAsPaid(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Settles an existing incomplete order (picked from incomplete-payments) as a
    // single one-off payment, folding in any insurance/delivery/VAT charges entered
    // at settlement time. Marks that same order paid instead of creating a new one.
    @PutMapping("/orders/{orderId}/settle-one-off")
    public BaseResponse settleOneOffOrder(@PathVariable Long orderId,
                                           @RequestBody(required = false) OneOffSettlementDto dto) {
        SalesOrder order = salesService.settleOneOffOrder(orderId, dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @PostMapping("/orders/{orderId}/refund")
    public BaseResponse processRefund(@PathVariable Long orderId, @RequestBody RefundDto refundDto) {
        SalesOrder order = salesService.processRefund(orderId, refundDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @PutMapping("/orders/{orderId}/cancel")
    public BaseResponse cancelOrder(@PathVariable Long orderId, @RequestBody CancelOrderDto cancelDto) {
        SalesOrder order = salesService.cancelSalesOrder(orderId, cancelDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Generate + persist a backend sales reference for an order (idempotent).
    @PostMapping("/orders/{orderId}/sales-reference")
    public BaseResponse generateSalesReference(@PathVariable Long orderId) {
        SalesOrder order = salesService.generateSalesReference(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Forwards an online order for admin sign-off (moves it to APPROVED, the status the
    // Online Sales Approvals screen reviews - does not itself clear the order for fulfilment).
    @PutMapping("/orders/{orderId}/submit-for-approval")
    public BaseResponse submitOrderForApproval(@PathVariable Long orderId,
                                                @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.submitOrderForApproval(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Approve an online order awaiting fulfilment (moves it to PROCESSING).
    @PutMapping("/orders/{orderId}/approve")
    public BaseResponse approveOrder(@PathVariable Long orderId,
                                     @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.approveOrder(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Reject an online order under review (cancels it with the reviewer's reason).
    @PutMapping("/orders/{orderId}/reject")
    public BaseResponse rejectOrder(@PathVariable Long orderId,
                                    @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.rejectOrder(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // ==================== CANCELLATION REQUESTS ====================

    // Orders a customer has asked to cancel, awaiting sales review.
    @GetMapping("/orders/cancellation-requests")
    public BaseResponse getCancellationRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getCancellationRequests(page, size));
    }

    // Cancellation requests sales has forwarded, awaiting admin's final decision.
    @GetMapping("/orders/pending-cancellation-approvals")
    public BaseResponse getPendingCancellationApprovals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getPendingCancellationApprovals(page, size));
    }

    // Walk-in orders sales can raise a cancellation request for.
    @GetMapping("/orders/walk-in-cancellable")
    public BaseResponse getWalkInCancellableOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getWalkInCancellableOrders(page, size));
    }

    // Sales raises a cancellation request on behalf of a walk-in customer - goes straight to
    // admin's approval queue since there is no customer request to review first.
    @PostMapping("/orders/{orderId}/cancellation/walk-in")
    public BaseResponse createWalkInCancellationRequest(@PathVariable Long orderId,
                                                         @RequestBody CancelOrderDto cancelDto) {
        SalesOrder order = salesService.createWalkInCancellationRequest(orderId, cancelDto.getReason());
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Sales: forward a customer's cancellation request to admin for approval.
    @PutMapping("/orders/{orderId}/cancellation/forward")
    public BaseResponse forwardCancellationToAdmin(@PathVariable Long orderId,
                                                    @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.forwardCancellationToAdmin(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Sales or admin: reject a pending cancellation request, restoring the order to its
    // status before the request was made.
    @PutMapping("/orders/{orderId}/cancellation/reject")
    public BaseResponse rejectCancellationRequest(@PathVariable Long orderId,
                                                   @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.rejectCancellationRequest(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Admin: approve a cancellation request sales forwarded - cancels the order and refunds
    // the customer's wallet.
    @PutMapping("/orders/{orderId}/cancellation/approve")
    public BaseResponse approveCancellation(@PathVariable Long orderId,
                                             @RequestBody(required = false) OrderDecisionDto decisionDto) {
        SalesOrder order = salesService.approveCancellation(orderId, decisionDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // Admin-approved online orders available to hand to a rider (Rider Box Management's
    // "Order Reference" dropdown).
    @GetMapping("/orders/ready-for-rider")
    public BaseResponse getOrdersReadyForRider(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getOrdersReadyForRider(page, size));
    }

    // ==================== PAYMENT TRACKING ====================

    @GetMapping("/orders/incomplete-payments")
    public BaseResponse getIncompletePayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            // Optional filters, all null (no filtering) by default so callers that share
            // this endpoint without an opinion on payment progress (OneOfOrder, Refund,
            // OnCreditSales/OnOneSales) keep seeing every incomplete order exactly as
            // before. Neither "Marking as paid" nor "Order list as paid" use this
            // endpoint anymore - see getOrdersBelowHalfPaid/getOrdersAwaitingSalesReference
            // below.
            @RequestParam(required = false) BigDecimal minPaymentPercentage,
            @RequestParam(required = false) BigDecimal maxPaymentPercentage,
            @RequestParam(required = false) Boolean salesReferenceNull) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getIncompletePayments(page, size, minPaymentPercentage, maxPaymentPercentage, salesReferenceNull));
    }

    // "Order list as paid" backing endpoint: orders with no salesReference yet whose
    // stored paymentProgress has crossed 50%, excluding ONE_OFF orders (those live on
    // the "One of order" screen - see getMobileOrdersPaidInFull below). Queried directly
    // off SalesOrder's own columns (SalesOrderRepository.findAwaitingSalesReference), not
    // derived from incomplete-payments' isPaid/status-filtered, recomputed-percentage list.
    @GetMapping("/orders/awaiting-sales-reference")
    public BaseResponse getOrdersAwaitingSalesReference(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getOrdersAwaitingSalesReference(page, size));
    }

    // "Marking as paid" backing endpoint: orders whose stored paymentProgress is still
    // under 50% - the <50% counterpart to getOrdersAwaitingSalesReference above, same
    // reasoning (see SalesOrderRepository.findByPaymentProgressLessThan).
    @GetMapping("/orders/below-half-paid")
    public BaseResponse getOrdersBelowHalfPaid(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getOrdersBelowHalfPaid(page, size));
    }

    // "One of order" backing endpoint: ONE_OFF orders that still need a sales reference - the
    // ones getOrdersAwaitingSalesReference above deliberately excludes (see
    // SalesOrderRepository.findOneOffOrdersAwaitingSalesReference). Not filtered on isPaid:
    // mobile one-off orders are mirrored in already settled, staff-entered ones arrive unpaid,
    // and both still need the reference this screen mints.
    @GetMapping("/orders/mobile-paid-in-full")
    public BaseResponse getMobileOrdersPaidInFull(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getMobileOrdersPaidInFull(page, size));
    }

    // "Completed payments" backing endpoint: orders that have a sales reference and have not
    // yet been forwarded to the admin approval queue - the screen's one action is
    // submit-for-approval above, so a row it cannot action has no business being listed (see
    // SalesOrderRepository.findReferencedOrdersNotYetSubmittedForApproval).
    @GetMapping("/orders/completed-payments")
    public BaseResponse getCompletedPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getCompletedPayments(page, size));
    }

    @GetMapping("/orders/{orderId}/payment-details")
    public BaseResponse getPaymentDetails(@PathVariable Long orderId) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getPaymentDetails(orderId));
    }

    // Starts a Paystack hosted checkout to collect the next due installment on an existing
    // order. The amount is priced server-side from the order's next PENDING/OVERDUE
    // repayment entry - see verifyOrderInstallmentPayment for the return-trip verification.
    @PostMapping("/orders/{orderId}/installment-payment/initialize")
    public BaseResponse initializeOrderInstallmentPayment(@PathVariable Long orderId,
                                                            @RequestBody OrderInstallmentPaymentInitializeDto dto) {
        Map<String, Object> result = salesService.initializeOrderInstallmentPayment(orderId, dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // Verifies a next-installment Paystack payment on return and, on success, marks the
    // targeted repayment entry PAID. Idempotent - safe to call again for the same reference.
    @GetMapping("/orders/installment-payment/verify/{reference}")
    public BaseResponse verifyOrderInstallmentPayment(@PathVariable String reference) {
        Map<String, Object> result = salesService.verifyOrderInstallmentPayment(reference);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // Plain, unfiltered page of every SalesOrder - backs the cashier's "cash payment"
    // reference-number picker (frontend/src/lib/cashierApi.js getSalesOrderReferences),
    // which was already calling this path with no matching endpoint behind it.
    @GetMapping("/orders")
    public BaseResponse getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return new BaseResponse(HttpStatus.OK.value(), "successful", salesService.getAllOrders(page, size));
    }

    // ==================== ORDER DETAILS ====================

    @GetMapping("/orders/{orderId}/details")
    public BaseResponse getOrderDetails(@PathVariable Long orderId) {
        SalesOrder order = salesService.getOrderDetails(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @GetMapping("/orders/reference/{referenceNo}")
    public BaseResponse getOrderByReference(@PathVariable String referenceNo) {
        SalesOrder order = salesService.getOrderByReferenceNo(referenceNo);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // ==================== NOTIFICATIONS ====================

    @GetMapping("/notifications/orderlist")
    public BaseResponse getOrderlistNotifications() {
        List<SalesNotification> notifications = salesService.getOrderlistNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    @GetMapping("/notifications/cancelled")
    public BaseResponse getCancelledNotifications() {
        List<SalesNotification> notifications = salesService.getCancelledNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    @GetMapping("/notifications/refund")
    public BaseResponse getRefundNotifications() {
        List<SalesNotification> notifications = salesService.getRefundNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    @GetMapping("/notifications/seen-counts")
    public BaseResponse getNotificationSeenCounts(@RequestParam Long userId) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.getNotificationSeenCounts(userId));
    }

    @PutMapping("/notifications/seen-counts")
    public BaseResponse saveNotificationSeenCounts(
            @RequestParam Long userId,
            @RequestBody NotificationSeenDto dto) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                salesService.saveNotificationSeenCounts(userId, dto));
    }

    // ==================== REPORTS ====================

    @GetMapping("/reports")
    public BaseResponse getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String orderMethod,
            @RequestParam(required = false) String displayOption,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getSalesReport(startDate, endDate, orderMethod, displayOption, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/orders")
    public BaseResponse getOrdersReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String orderMethod,
            @RequestParam(required = false) String displayOption,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOrdersReport(startDate, endDate, orderMethod, displayOption, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/orders/actions")
    public BaseResponse getOrdersActionReport(
            @RequestParam String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOrdersActionReport(action, startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/online/installment")
    public BaseResponse getOnlineInstallmentReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOnlineInstallmentReport(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/online/one-off")
    public BaseResponse getOnlineOneOffReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOnlineOneOffReport(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/all/online")
    public BaseResponse getAllOnlineSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getAllOnlineSales(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/all/walk-in")
    public BaseResponse getAllWalkInSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getAllWalkInSales(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/walk-in/credit")
    public BaseResponse getWalkInCreditReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getWalkInCreditReport(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/walk-in/cash")
    public BaseResponse getWalkInCashReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getWalkInCashReport(startDate, endDate, branchId, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    // Branch module: all sales processed at a specific branch (optionally within a date range).
    @GetMapping("/branch/{branchId}")
    public BaseResponse getBranchSales(
            @PathVariable Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<SalesOrder> orders = salesService.getBranchSales(branchId, startDate, endDate);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/refund-return")
    public BaseResponse getRefundReturnReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getRefundReturnReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/cancelled")
    public BaseResponse getCancelledOrdersReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getCancelledOrdersReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }
}

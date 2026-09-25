package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.*;
import com.appGate.orderingsales.enums.*;
import com.appGate.orderingsales.models.LoanDetails;
import com.appGate.orderingsales.models.LoanRepaymentEntry;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.models.OrderNotificationSeen;
import com.appGate.orderingsales.models.SalesNotification;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.orderingsales.repository.LoanDetailsRepository;
import com.appGate.orderingsales.repository.LoanRepaymentEntryRepository;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.repository.OrderNotificationSeenRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesNotificationRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.rbac.service.BranchScopeService;
import com.appGate.account.dto.FundWalletDto;
import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.models.Installment;
import com.appGate.account.models.InstallmentPlan;
import com.appGate.account.models.Payment;
import com.appGate.account.repository.InstallmentPlanRepository;
import com.appGate.account.repository.InstallmentRepository;
import com.appGate.account.repository.PaymentRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.PaymentGatewayService;
import com.appGate.account.service.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesService {

    private final SalesOrderRepository salesOrderRepository;
    private final LoanDetailsRepository loanDetailsRepository;
    private final LoanRepaymentEntryRepository loanRepaymentEntryRepository;
    private final SalesNotificationRepository salesNotificationRepository;
    private final StockRepository stockRepository;
    private final OrderNotificationSeenRepository orderNotificationSeenRepository;
    private final OrderItemRepository orderItemRepository;
    private final BranchScopeService branchScopeService;
    private final PaymentGatewayService paymentGatewayService;
    private final com.appGate.account.service.GlPostingService glPostingService;
    private final ObjectMapper objectMapper;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;
    // Mobile-side repositories - only used to read live installment/payment truth for
    // SalesOrders that mirror a mobile order (mobileOrderId != null), since the
    // LoanDetails/LoanRepaymentEntry mirror can lag or silently fail to sync (see
    // MobileSalesOrderSyncService's javadoc). See resolvePaymentProgress.
    private final OrderRepository orderRepository;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final InstallmentRepository installmentRepository;

    // Shared by processRefund/rejectOrder/approveOrder/submitOrderForApproval: none of them
    // should be allowed once an order has been handed to a rider or delivered. Previously each
    // method gated on a different, inconsistent subset of these statuses.
    private static final EnumSet<OrderStatus> DISPATCHED_STATUSES = EnumSet.of(
            OrderStatus.ASSIGNED_TO_RIDER, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED);

    // Statuses that take a one-off order off the "One of order" screen for good: a
    // cancelled/refunded/failed order has no business getting a sales reference minted for it.
    // See getMobileOrdersPaidInFull. Orders mid-cancellation-review stay listed - that request
    // can still be rejected, after which the order is actionable again.
    private static final List<OrderStatus> ONE_OFF_INELIGIBLE_STATUSES = List.of(
            OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.FAILED);

    // Statuses that take an order off the "Completed payments" screen: it has already been
    // forwarded to the admin approval queue (APPROVED, set by submitOrderForApproval) or moved
    // past it (PROCESSING onward), or it is dead (CANCELLED/REFUNDED, which submitOrderForApproval
    // rejects outright). Mirrors ALREADY_FORWARDED_STATUSES in CompletedPayments.jsx, which was
    // greying out exactly these rows client-side. See getCompletedPayments.
    private static final List<OrderStatus> FORWARDED_FOR_APPROVAL_STATUSES = List.of(
            OrderStatus.APPROVED, OrderStatus.PROCESSING, OrderStatus.ASSIGNED_TO_RIDER,
            OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED,
            OrderStatus.CANCELLED, OrderStatus.REFUNDED);

    // Generate unique reference number
    private String generateReferenceNo() {
        return "PROWIT" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    // ==================== ORDER CREATION ====================

    @Transactional
    public SalesOrder createOneOffOrder(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.ONE_OFF, CustomerType.ONLINE);
        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New one-off order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    @Transactional
    public SalesOrder createInstallmentOrder(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.INSTALLMENT, CustomerType.ONLINE);

        // Create loan details if provided
        if (dto.getLoanInfo() != null) {
            LoanDetails loanDetails = createLoanDetails(savedOrder, dto.getLoanInfo());
            loanDetailsRepository.save(loanDetails);
            createInstallmentPlanShadow(savedOrder, loanDetails);
        }

        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New installment order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    @Transactional
    public SalesOrder createOnlineOneOffSales(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.ONE_OFF, CustomerType.ONLINE);
        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New one-off order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    @Transactional
    public SalesOrder createOnlineCreditSales(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.CREDIT, CustomerType.ONLINE);
        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New credit order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    @Transactional
    public SalesOrder createWalkInCashSales(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.CASH, CustomerType.WALKIN);
        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New walk-in cash order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    @Transactional
    public SalesOrder createWalkInCreditSales(SalesOrderDto dto) {
        SalesOrder savedOrder = createBaseSalesOrder(dto, SalesOrderType.CREDIT, CustomerType.WALKIN);

        // Create loan details if provided
        if (dto.getLoanInfo() != null) {
            LoanDetails loanDetails = createLoanDetails(savedOrder, dto.getLoanInfo());
            loanDetailsRepository.save(loanDetails);
            createInstallmentPlanShadow(savedOrder, loanDetails);
        }

        createNotification(savedOrder, NotificationType.ORDERLIST,
                "New walk-in credit order placed by " + savedOrder.getCustomerName());
        return savedOrder;
    }

    // Same as createWalkInCreditSales, but for a credit sale whose first installment was
    // already collected via Paystack (see
    // SalesController.initializeCreditFirstInstallmentPayment/verifyCreditFirstInstallmentPayment,
    // called directly from there - no admin pre-approval gate). Without this, the money
    // Paystack already confirmed would be silently dropped: no repayment schedule would ever
    // be generated and no Payment/LoanRepaymentEntry row would record it, so the order would
    // sit at 0% paid despite the customer having paid the first installment (mirrors the same
    // class of bug MobileSalesOrderSyncService fixes for mobile orders).
    @Transactional
    public SalesOrder createWalkInCreditSalesWithFirstInstallment(SalesOrderDto dto, BigDecimal firstInstallmentAmount,
                                                                    String firstInstallmentReference,
                                                                    LocalDateTime firstInstallmentPaidAt) {
        SalesOrder savedOrder = createWalkInCreditSales(dto);
        if (firstInstallmentAmount != null && firstInstallmentAmount.compareTo(BigDecimal.ZERO) > 0) {
            recordCreditFirstInstallmentPayment(savedOrder, firstInstallmentAmount, firstInstallmentReference, firstInstallmentPaidAt);
        }
        return savedOrder;
    }

    // Records a first-installment payment already collected via Paystack against the walk-in
    // credit sale that was just approved: generates the repayment schedule, marks its first
    // entry PAID, and writes the Payment row for audit - the same pieces resolvePaymentProgress
    // and getPaymentDetails read to show real progress instead of 0%.
    private void recordCreditFirstInstallmentPayment(SalesOrder order, BigDecimal amountPaid, String reference,
                                                       LocalDateTime paidAt) {
        // Idempotent: paymentReference is unique, so a retried approval can't double-record it.
        if (reference != null && paymentRepository.findByPaymentReference(reference).isPresent()) {
            return;
        }

        LocalDateTime effectivePaidAt = paidAt != null ? paidAt : LocalDateTime.now();

        Payment payment = new Payment();
        payment.setSalesOrderId(order.getId());
        payment.setUserId(order.getCustomerId() != null ? order.getCustomerId() : 0L);
        payment.setAmount(amountPaid.doubleValue());
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentReference(reference);
        payment.setIsInstallmentPayment(true);
        payment.setPaidAt(effectivePaidAt);
        payment = paymentRepository.save(payment);

        loanDetailsRepository.findBySalesOrderId(order.getId()).ifPresent(loan -> {
            generateRepaymentSchedule(order.getId());
            List<LoanRepaymentEntry> entries = loanRepaymentEntryRepository
                    .findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId());
            entries.stream()
                    .filter(e -> e.getEntryNumber() == 1)
                    .findFirst()
                    .ifPresent(entry -> {
                        // Only call it settled when it actually covers what was due. The
                        // amount comes from the client's initialize call, so an under-payment
                        // used to mark installment #1 fully PAID regardless.
                        boolean covered = entry.getAmountDue() == null
                                || amountPaid.compareTo(entry.getAmountDue()) >= 0;
                        entry.setStatus(covered ? "PAID" : "PARTIAL");
                        entry.setAmountPaid(amountPaid);
                        entry.setPaidDate(effectivePaidAt.toLocalDate());
                        loanRepaymentEntryRepository.save(entry);
                        if (!covered) {
                            System.err.println("UNDER-PAYMENT on sales order " + order.getSalesReference()
                                    + ": first installment collected " + amountPaid + " of "
                                    + entry.getAmountDue() + " due (reference " + reference + ")");
                        }
                    });

            BigDecimal totalPaid = loanRepaymentEntryRepository.sumAmountPaidByLoanDetailsId(loan.getId());
            BigDecimal scheduleTotal = repaymentScheduleTotal(loan, order);
            if (scheduleTotal.compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentProgress(totalPaid.multiply(BigDecimal.valueOf(100))
                        .divide(scheduleTotal, 2, RoundingMode.HALF_UP));
            }
            markFullyPaidIfComplete(order, loan);
            salesOrderRepository.save(order);
        });

        markShadowInstallmentPaid(order.getId(), 1, amountPaid, effectivePaidAt.toLocalDate(), payment.getId());

        // Dr the branch's Paystack GL, Cr its Sales GL - this money arrived through
        // Paystack exactly like a walk-in cash sale, which has always posted.
        glPostingService.postPaystackSale(order.getBranchId(), amountPaid.doubleValue(),
                reference, order.getCustomerId());

        createNotification(order, NotificationType.ORDERLIST,
                "First installment payment of " + amountPaid + " received for order by " + order.getCustomerName());
    }

    // Phase 2 of the order/SalesOrder unification: mirrors an installment payment onto
    // the shadow InstallmentPlan/Installment rows (see InstallmentPlan.salesOrderId).
    // A no-op if there's no shadow plan/installment for this order/number yet, or if
    // that installment is already marked PAID (idempotency, matching the LoanRepaymentEntry
    // side's unique-paymentReference guard). Always a no-op for a mobile-originated order,
    // since InstallmentPlan.salesOrderId is never set for those (see its field comment) -
    // this used to be reachable with real money already collected (via
    // initializeOrderInstallmentPayment/markAsPaid on a channel==MOBILE SalesOrder) and
    // silently vanishing here instead of reaching the real plan; both callers now refuse
    // to run against a MOBILE-channel order before they ever get this far.
    private void markShadowInstallmentPaid(Long salesOrderId, int installmentNumber, BigDecimal amountPaid,
                                            LocalDate paidDate, Long paymentId) {
        installmentPlanRepository.findBySalesOrderId(salesOrderId).ifPresent(plan ->
                installmentRepository.findByInstallmentPlanId(plan.getId()).stream()
                        .filter(i -> i.getInstallmentNumber() == installmentNumber)
                        .findFirst()
                        .ifPresent(installment -> {
                            if (installment.getStatus() == InstallmentStatus.PAID) {
                                return;
                            }
                            installment.setStatus(InstallmentStatus.PAID);
                            installment.setAmountPaid(amountPaid.doubleValue());
                            installment.setPaidDate(paidDate);
                            installment.setPaymentId(paymentId);
                            installmentRepository.save(installment);

                            plan.setCompletedInstallments(plan.getCompletedInstallments() + 1);
                            if (plan.getCompletedInstallments().equals(plan.getNumberOfInstallments())) {
                                plan.setStatus(InstallmentStatus.COMPLETED);
                                plan.setCompletionDate(LocalDate.now());
                            }
                            installmentPlanRepository.save(plan);
                        }));
    }

    // ==================== WALK-IN CASH SALE — PAYSTACK CHECKOUT ====================

    // Starts a Paystack hosted checkout for a walk-in cash-sale cart. The cart survives
    // the Paystack redirect round trip by riding along as JSON inside Paystack's own
    // "metadata" field (Paystack echoes metadata back on verify) — no new DB table.
    public Map<String, Object> initializeWalkInCashPayment(WalkInCashPaymentInitializeDto dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }
        if (dto.getAmount() == null || dto.getAmount() <= 0) {
            throw new RuntimeException("Enter a valid amount");
        }

        String reference = "WIC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "WALK_IN_CASH_SALE");
            metadata.put("itemsJson", objectMapper.writeValueAsString(dto.getItems()));

            Map<String, Object> data = paymentGatewayService.initializePaystackTransaction(
                    dto.getEmail(), dto.getAmount(), reference, dto.getCallbackUrl(), metadata);
            if (data == null) {
                throw new RuntimeException("Could not start Paystack payment");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("reference", reference);
            result.put("authorizationUrl", data.get("authorization_url"));
            result.put("accessCode", data.get("access_code"));
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Could not serialize cart items: " + e.getMessage(), e);
        }
    }

    // Verifies a Paystack payment on return and, on success, creates the paid
    // SalesOrder(s) for the cart carried through Paystack's metadata — bypassing the
    // manual admin-approval queue the "/admin/approvals" CASH_SALES flow otherwise
    // requires, since the money has already been confirmed by Paystack.
    @Transactional
    public Map<String, Object> verifyWalkInCashPayment(String reference) {
        // Idempotency: a repeat callback / page refresh must not re-create orders or
        // re-decrement stock.
        List<SalesOrder> existing = salesOrderRepository.findBySalesReferenceStartingWith(reference);
        if (!existing.isEmpty()) {
            return walkInPaymentResult("success", reference, existing, true, null);
        }

        Map<String, Object> data = paymentGatewayService.verifyPaystackTransaction(reference);
        if (data == null || !"success".equals(data.get("status"))) {
            return walkInPaymentResult("failed", reference, List.of(), false, "Payment was not successful");
        }

        Object metadataObj = data.get("metadata");
        String itemsJson = (metadataObj instanceof Map)
                ? (String) ((Map<?, ?>) metadataObj).get("itemsJson")
                : null;
        if (itemsJson == null || itemsJson.isBlank()) {
            return walkInPaymentResult("failed", reference, List.of(), false, "No cart data found for this payment");
        }

        List<SalesOrderDto> items;
        try {
            items = objectMapper.readValue(itemsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SalesOrderDto.class));
        } catch (Exception e) {
            return walkInPaymentResult("failed", reference, List.of(), false, "Could not read cart data: " + e.getMessage());
        }

        // Never trust the client-supplied "amount" from initialize alone — recompute the
        // expected total from the cart itself and compare against what Paystack actually
        // confirms was collected before creating any paid orders.
        BigDecimal expected = items.stream()
                .map(SalesService::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Object paidKobo = data.get("amount");
        BigDecimal paid = paidKobo instanceof Number
                ? BigDecimal.valueOf(((Number) paidKobo).longValue()).divide(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        if (paid.compareTo(expected) < 0) {
            return walkInPaymentResult("failed", reference, List.of(), false,
                    "Amount mismatch: paid " + paid + " but cart totals " + expected);
        }

        List<SalesOrder> createdOrders = new ArrayList<>();
        int i = 0;
        for (SalesOrderDto itemDto : items) {
            i++;
            SalesOrder order = createWalkInCashSales(itemDto);
            order.setSalesReference(reference + "-" + i);
            order = salesOrderRepository.save(order);

            // Record the Paystack collection against this sale BEFORE marking it paid:
            // walk-in cash sales previously produced no `payments` row at all, so the
            // money was invisible to every payment report and nothing tied the gateway
            // reference to the order. Doing it here also stops markAsPaid writing a
            // manual-settlement artefact over a real gateway payment.
            recordGatewaySettlement(order, lineTotal(itemDto), reference + "-" + i);

            order = markAsPaid(order.getId());

            // Paystack already confirmed the cash, so skip both the manual "Send for
            // Approval" step (see CompletedPayments.jsx) and the manual admin-approval
            // click (see OnlineSalesApproval.jsx/approveOrder, which has no side effects
            // beyond this same status flip) - land the order directly on PROCESSING so
            // it's immediately ready for rider assignment (see
            // findOrdersReadyForRiderAssignment) without any further admin action.
            order.setStatus(OrderStatus.PROCESSING);
            order = salesOrderRepository.save(order);
            createdOrders.add(order);
        }

        // Dr the selling branch's Paystack GL, Cr its Sales GL, for the amount Paystack collected.
        if (!createdOrders.isEmpty()) {
            glPostingService.postPaystackSale(createdOrders.get(0).getBranchId(), paid.doubleValue(), reference, null);
        }

        return walkInPaymentResult("success", reference, createdOrders, false, null);
    }

    private static BigDecimal lineTotal(SalesOrderDto dto) {
        ProductInfoDto product = dto.getProductInfo();
        if (product == null) return BigDecimal.ZERO;
        BigDecimal price = product.getPrice() != null ? product.getPrice()
                : (product.getUnitPrice() != null ? product.getUnitPrice() : BigDecimal.ZERO);
        int qty = product.getQuantity() != null ? product.getQuantity() : 1;
        BigDecimal discount = product.getDiscount() != null ? product.getDiscount() : BigDecimal.ZERO;
        return price.multiply(BigDecimal.valueOf(qty)).subtract(discount);
    }

    private Map<String, Object> walkInPaymentResult(String status, String reference, List<SalesOrder> orders,
                                                      boolean alreadyProcessed, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("reference", reference);
        result.put("orders", orders);
        result.put("alreadyProcessed", alreadyProcessed);
        if (message != null) {
            result.put("message", message);
        }
        return result;
    }

    // ==================== WALK-IN CREDIT SALE — FIRST INSTALLMENT PAYSTACK CHECKOUT ====================

    // Starts a Paystack hosted checkout for the first installment of a walk-in credit
    // sale that has not been submitted yet (no SalesOrder/LoanDetails exist at this point -
    // the credit-sale form only creates an approval request when saved). The draft sale
    // rides along inside Paystack's own "metadata" field, the same trick used for the
    // walk-in cash cart above, so no pending-payment table is needed.
    public Map<String, Object> initializeCreditFirstInstallmentPayment(CreditFirstInstallmentPaymentInitializeDto dto) {
        if (dto.getSaleData() == null || dto.getSaleData().getCustomerInfo() == null
                || dto.getSaleData().getProductInfo() == null) {
            throw new RuntimeException("Product and customer information are required");
        }
        if (dto.getFirstInstallmentAmount() == null || dto.getFirstInstallmentAmount() <= 0) {
            throw new RuntimeException("Enter a valid first installment amount");
        }
        if (dto.getRequestedBy() == null) {
            throw new RuntimeException("Requested-by user is required");
        }

        String reference = "CFI-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "CREDIT_FIRST_INSTALLMENT");
            metadata.put("saleDataJson", objectMapper.writeValueAsString(dto.getSaleData()));
            metadata.put("requestedBy", dto.getRequestedBy());
            metadata.put("comments", dto.getComments() != null ? dto.getComments() : "");

            Map<String, Object> data = paymentGatewayService.initializePaystackTransaction(
                    dto.getEmail(), dto.getFirstInstallmentAmount(), reference, dto.getCallbackUrl(), metadata);
            if (data == null) {
                throw new RuntimeException("Could not start Paystack payment");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("reference", reference);
            result.put("authorizationUrl", data.get("authorization_url"));
            result.put("accessCode", data.get("access_code"));
            return result;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Could not serialize credit sale data: " + e.getMessage(), e);
        }
    }

    // Verifies the first-installment Paystack payment on return and, on success, creates the
    // walk-in credit SalesOrder immediately - per order_rules.txt #2b a credit sale should
    // land straight in "Marking as paid" like an online installment order, not sit behind a
    // hidden pre-approval gate before it even exists. (This used to file a CREDIT_SALES
    // ApprovalRequest instead; ApprovalService.createWalkInCreditSaleFromApproval is now
    // unreachable from this path, left in place only for any request filed through the
    // generic /admin/approvals endpoints directly.)
    @Transactional
    public Map<String, Object> verifyCreditFirstInstallmentPayment(String reference) {
        // Idempotency: a repeat callback / page refresh must not create a second order.
        // recordCreditFirstInstallmentPayment's own paymentReference guard only stops the
        // *payment* being double-recorded, not the *order* being double-created, so this has
        // to be checked before createWalkInCreditSalesWithFirstInstallment is ever called.
        Optional<Payment> existingPayment = paymentRepository.findByPaymentReference(reference);
        if (existingPayment.isPresent()) {
            SalesOrder existingOrder = salesOrderRepository.findById(existingPayment.get().getSalesOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found for already-processed payment"));
            return creditFirstInstallmentResult("success", reference, existingOrder, true, null);
        }

        Map<String, Object> data = paymentGatewayService.verifyPaystackTransaction(reference);
        if (data == null || !"success".equals(data.get("status"))) {
            return creditFirstInstallmentResult("failed", reference, null, false, "Payment was not successful");
        }

        Object metadataObj = data.get("metadata");
        Map<?, ?> metadata = (metadataObj instanceof Map) ? (Map<?, ?>) metadataObj : null;
        String saleDataJson = metadata != null ? (String) metadata.get("saleDataJson") : null;
        if (saleDataJson == null || saleDataJson.isBlank()) {
            return creditFirstInstallmentResult("failed", reference, null, false, "No credit sale data found for this payment");
        }

        SalesOrderDto saleData;
        String comments;
        try {
            saleData = objectMapper.readValue(saleDataJson, SalesOrderDto.class);
            Object commentsObj = metadata.get("comments");
            comments = commentsObj != null ? commentsObj.toString() : "";
        } catch (Exception e) {
            return creditFirstInstallmentResult("failed", reference, null, false, "Could not read credit sale data: " + e.getMessage());
        }

        Object paidKobo = data.get("amount");
        BigDecimal paid = paidKobo instanceof Number
                ? BigDecimal.valueOf(((Number) paidKobo).longValue()).divide(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        SalesOrder createdOrder = createWalkInCreditSalesWithFirstInstallment(
                saleData, paid, reference, LocalDateTime.now());

        if (comments != null && !comments.isBlank()) {
            createdOrder.setComment(comments);
            createdOrder = salesOrderRepository.save(createdOrder);
        }

        return creditFirstInstallmentResult("success", reference, createdOrder, false, null);
    }

    private Map<String, Object> creditFirstInstallmentResult(String status, String reference, SalesOrder order,
                                                               boolean alreadyProcessed, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("reference", reference);
        result.put("order", order);
        result.put("alreadyProcessed", alreadyProcessed);
        if (message != null) {
            result.put("message", message);
        }
        return result;
    }

    // ==================== EXISTING ORDER — NEXT INSTALLMENT PAYSTACK CHECKOUT ====================

    // Starts a Paystack hosted checkout to collect the next due installment on an order that
    // already exists (and already has LoanDetails/LoanRepaymentEntry rows). The amount is
    // always priced server-side from the order's next PENDING/OVERDUE repayment entry - never
    // taken from the client - the same principle already used by /installments/calculate.
    public Map<String, Object> initializeOrderInstallmentPayment(Long orderId, OrderInstallmentPaymentInitializeDto dto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // A channel=MOBILE SalesOrder is only a read-visibility mirror of a mobile Order/
        // InstallmentPlan (see SalesChannel.MOBILE) - it is never the record of what's
        // actually owed. Collecting payment here writes to LoanRepaymentEntry/this
        // SalesOrder only; markShadowInstallmentPaid can't write it back to the real
        // InstallmentPlan because a mobile-originated plan never carries this SalesOrder's
        // id (InstallmentPlan.salesOrderId stays null - only orderId is set, see
        // MobileSalesOrderSyncService.createMirror). That let a real Paystack charge get
        // collected here while the authoritative InstallmentPlan/Installment rows the
        // mobile app reads kept showing the balance as still owed. Mobile-originated
        // installment orders must be paid through the mobile app's own flow
        // (InstallmentService.payNextInstallmentByWallet / OrderService.payOrderByWallet).
        if (order.getChannel() == SalesChannel.MOBILE) {
            throw new RuntimeException(
                    "This order was placed through the mobile app and must be paid there - "
                            + "installment payments can't be collected from the admin/sales side for it.");
        }

        // This admin-side Paystack popup is only for walk-in customers settling an
        // outstanding balance in person; online-storefront customers (CustomerType.ONLINE,
        // SalesChannel.ONLINE) pay through the storefront's own checkout flow.
        if (order.getCustomerType() != CustomerType.WALKIN) {
            throw new RuntimeException(
                    "This payment option is only available for walk-in customers.");
        }

        if (order.getLoanDetails() == null) {
            throw new RuntimeException("This order has no installment plan");
        }

        LoanRepaymentEntry nextEntry = loanRepaymentEntryRepository
                .findByLoanDetailsIdOrderByEntryNumberAsc(order.getLoanDetails().getId())
                .stream()
                .filter(e -> "PENDING".equals(e.getStatus()) || "OVERDUE".equals(e.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("This order is already fully paid"));

        BigDecimal amount = nextEntry.getAmountDue();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Could not determine the next installment amount");
        }

        String email = (dto.getEmail() != null && !dto.getEmail().isBlank()) ? dto.getEmail() : order.getEmail();
        String reference = "INST-" + orderId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("type", "ORDER_INSTALLMENT");
        metadata.put("orderId", orderId);
        metadata.put("entryId", nextEntry.getId());

        Map<String, Object> data = paymentGatewayService.initializePaystackTransaction(
                email, amount.doubleValue(), reference, dto.getCallbackUrl(), metadata);
        if (data == null) {
            throw new RuntimeException("Could not start Paystack payment");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("reference", reference);
        result.put("authorizationUrl", data.get("authorization_url"));
        result.put("accessCode", data.get("access_code"));
        result.put("amount", amount);
        result.put("entryNumber", nextEntry.getEntryNumber());
        return result;
    }

    // Verifies a Paystack payment on return and, on success, marks the targeted repayment
    // entry PAID and records a Payment row for audit/idempotency. Idempotent: a repeat
    // callback / page refresh for the same reference (or an entry already PAID) is a no-op.
    @Transactional
    public Map<String, Object> verifyOrderInstallmentPayment(String reference) {
        Optional<Payment> existingPayment = paymentRepository.findByPaymentReference(reference);
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            BigDecimal paidAmount = payment.getAmount() != null ? BigDecimal.valueOf(payment.getAmount()) : null;
            return orderInstallmentResult("success", reference, payment.getSalesOrderId(), null, paidAmount, true, null);
        }

        Map<String, Object> data = paymentGatewayService.verifyPaystackTransaction(reference);
        if (data == null || !"success".equals(data.get("status"))) {
            return orderInstallmentResult("failed", reference, null, null, null, false, "Payment was not successful");
        }

        Object metadataObj = data.get("metadata");
        Map<?, ?> metadata = (metadataObj instanceof Map) ? (Map<?, ?>) metadataObj : null;
        Long orderId = numberFromMetadata(metadata, "orderId");
        Long entryId = numberFromMetadata(metadata, "entryId");
        if (orderId == null || entryId == null) {
            return orderInstallmentResult("failed", reference, null, null, null, false, "No order data found for this payment");
        }

        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Defense in depth: initializeOrderInstallmentPayment already refuses to open a
        // checkout for a MOBILE-channel order, but this reference/metadata was handed to
        // Paystack and could in principle be replayed - refuse to apply it here too rather
        // than silently writing the payment onto a mirror the real order can't see (see
        // the guard and comment in initializeOrderInstallmentPayment for the full story).
        if (order.getChannel() == SalesChannel.MOBILE) {
            return orderInstallmentResult("failed", reference, orderId, null, null, false,
                    "This order was placed through the mobile app and must be paid there");
        }

        LoanRepaymentEntry entry = loanRepaymentEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Repayment entry not found"));

        if ("PAID".equals(entry.getStatus())) {
            return orderInstallmentResult("success", reference, orderId, entry.getEntryNumber(), entry.getAmountDue(), true, null);
        }

        Object paidKobo = data.get("amount");
        BigDecimal paid = paidKobo instanceof Number
                ? BigDecimal.valueOf(((Number) paidKobo).longValue()).divide(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        BigDecimal amountDue = entry.getAmountDue() != null ? entry.getAmountDue() : BigDecimal.ZERO;
        if (paid.compareTo(amountDue) < 0) {
            return orderInstallmentResult("failed", reference, orderId, entry.getEntryNumber(), amountDue, false,
                    "Amount mismatch: paid " + paid + " but installment due is " + amountDue);
        }

        entry.setAmountPaid(amountDue);
        entry.setStatus("PAID");
        entry.setPaidDate(LocalDate.now());
        loanRepaymentEntryRepository.save(entry);

        if (order.getLoanDetails() != null) {
            LoanDetails loan = order.getLoanDetails();
            BigDecimal totalPaid = loanRepaymentEntryRepository.sumAmountPaidByLoanDetailsId(loan.getId());
            BigDecimal scheduleTotal = repaymentScheduleTotal(loan, order);
            if (scheduleTotal.compareTo(BigDecimal.ZERO) > 0) {
                order.setPaymentProgress(totalPaid.multiply(BigDecimal.valueOf(100))
                        .divide(scheduleTotal, 2, RoundingMode.HALF_UP));
            }
            markFullyPaidIfComplete(order, loan);
            salesOrderRepository.save(order);
        }

        Payment payment = new Payment();
        // orderId here is a SalesOrder id, not a mobile Order id - store it in
        // salesOrderId so it can't be conflated with the mobile-side payment rows that
        // share this same `payments` table (see Payment.orderId/salesOrderId javadoc).
        payment.setSalesOrderId(orderId);
        payment.setUserId(order.getCustomerId() != null ? order.getCustomerId() : 0L);
        payment.setAmount(amountDue.doubleValue());
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentReference(reference);
        payment.setIsInstallmentPayment(true);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);

        markShadowInstallmentPaid(orderId, entry.getEntryNumber(), amountDue, LocalDate.now(), payment.getId());

        // Paystack money in, so it posts like any other Paystack sale for this branch.
        glPostingService.postPaystackSale(order.getBranchId(), amountDue.doubleValue(),
                reference, order.getCustomerId());

        createNotification(order, NotificationType.ORDERLIST,
                "Installment payment of " + amountDue + " received for order by " + order.getCustomerName());

        return orderInstallmentResult("success", reference, orderId, entry.getEntryNumber(), amountDue, false, null);
    }

    // The total payment progress must be measured against: the loan's interest-inclusive
    // totalRepayment for a loan-based order (that's what the repayment schedule in
    // generateRepaymentSchedule actually sizes each installment against), falling back to
    // the order's own totalAmount for a plain one-off order. Dividing by
    // order.getTotalAmount() (product price only, no interest) unconditionally was the
    // cause of payment_progress exceeding 100% once an interest-bearing installment plan
    // was fully paid off.
    private BigDecimal repaymentScheduleTotal(LoanDetails loan, SalesOrder order) {
        if (loan != null && loan.getTotalRepayment() != null && loan.getTotalRepayment().compareTo(BigDecimal.ZERO) > 0) {
            return loan.getTotalRepayment();
        }
        return order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
    }

    // Flips isPaid/paidAt/status once every repayment entry in the schedule is PAID. The
    // walk-in installment payment paths (recordCreditFirstInstallmentPayment,
    // verifyOrderInstallmentPayment) previously only ever updated paymentProgress and left
    // isPaid false forever - even once the full balance was collected - unlike the mobile
    // order path (MobileSalesOrderSyncService.syncInstallmentPaid), which does this via its
    // planCompleted flag.
    private void markFullyPaidIfComplete(SalesOrder order, LoanDetails loan) {
        List<LoanRepaymentEntry> entries = loanRepaymentEntryRepository
                .findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId());
        if (!entries.isEmpty() && entries.stream().allMatch(e -> "PAID".equals(e.getStatus()))) {
            order.setIsPaid(true);
            order.setPaidAt(LocalDateTime.now());
            order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        }
    }

    private Long numberFromMetadata(Map<?, ?> metadata, String key) {
        if (metadata == null) return null;
        Object value = metadata.get(key);
        if (value instanceof Number) return ((Number) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, Object> orderInstallmentResult(String status, String reference, Long orderId, Integer entryNumber,
                                                         BigDecimal amountPaid, boolean alreadyProcessed, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("status", status);
        result.put("reference", reference);
        result.put("orderId", orderId);
        result.put("entryNumber", entryNumber);
        result.put("amountPaid", amountPaid);
        result.put("alreadyProcessed", alreadyProcessed);
        if (message != null) {
            result.put("message", message);
        }
        return result;
    }

    private SalesOrder createBaseSalesOrder(SalesOrderDto dto, SalesOrderType orderType, CustomerType customerType) {
        SalesOrder order = new SalesOrder();
        order.setReferenceNo(generateReferenceNo());
        order.setOrderType(orderType);
        order.setCustomerType(customerType);
        // createBaseSalesOrder is only ever called with WALKIN or ONLINE (never for a
        // mobile mirror - that's MobileSalesOrderSyncService.createMirror, which sets
        // MOBILE directly), so this maps 1:1 onto SalesChannel today.
        order.setChannel(customerType == CustomerType.WALKIN ? SalesChannel.WALKIN : SalesChannel.ONLINE);
        order.setStatus(OrderStatus.PENDING);
        order.setFulfillmentType(dto.getFulfillmentType() != null ? dto.getFulfillmentType() : FulfillmentType.DELIVERY);

        // Set product info
        if (dto.getProductInfo() != null) {
            ProductInfoDto product = dto.getProductInfo();
            // SalesOrder.productId exists but was never actually populated here - every
            // walk-in/online order left it null, which is also why createOrderItemForSalesOrder
            // had to re-derive the id from the DTO instead of reading it off the saved order.
            if (product.getProductId() != null) {
                try {
                    order.setProductId(Long.parseLong(product.getProductId()));
                } catch (NumberFormatException ignored) {
                    // productId is not a numeric Long - left null, matching decrementBranchStock's tolerance
                }
            }
            order.setProductName(product.getProductName());
            order.setCategory(product.getCategory());
            order.setSubCategory(product.getSubCategory());
            order.setDescription(product.getDescription());
            order.setUnitPrice(product.getPrice() != null ? product.getPrice() : product.getUnitPrice());
            order.setQuantity(product.getQuantity() != null ? product.getQuantity() : 1);
            order.setDiscount(product.getDiscount() != null ? product.getDiscount() : BigDecimal.ZERO);
            order.setCoupon(product.getCoupon());

            // Calculate total
            BigDecimal price = order.getUnitPrice() != null ? order.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
            int qty = order.getQuantity() != null ? order.getQuantity() : 1;
            order.setTotalAmount(price.multiply(BigDecimal.valueOf(qty)).subtract(discount));
        }

        // Set customer info
        if (dto.getCustomerInfo() != null) {
            CustomerInfoDto customer = dto.getCustomerInfo();
            order.setCustomerName(customer.getCustomerName());
            order.setAccountNumber(customer.getAccountNumber());
            order.setEmail(customer.getEmail());
            order.setPhoneNumber(customer.getPhoneNumber());
            order.setAddress(customer.getAddress());
            order.setCustomerBankAccount(customer.getCustomerBankAccount());
        }

        // Tag the order with the branch that processed the sale. A branch user always
        // books the sale against their own branch, whatever the request body claims.
        order.setBranchId(branchScopeService.resolveWriteBranchId(dto.getBranchId()));

        // Decrement branch stock for the product being sold. Keyed on the branch the order
        // was actually booked against, not on dto.getBranchId(): the walk-in screens send
        // no branchId in the body (the branch travels in the X-Branch-Id header), so this
        // used to skip silently and every walk-in sale sold stock it never removed.
        if (order.getBranchId() != null && dto.getProductInfo() != null
                && dto.getProductInfo().getProductId() != null) {
            try {
                Long productId = Long.parseLong(dto.getProductInfo().getProductId());
                int qty = order.getQuantity() != null ? order.getQuantity() : 1;
                decrementBranchStock(productId, order.getBranchId(), qty);
            } catch (NumberFormatException ignored) {
                // productId is not a numeric Long — stock decrement skipped
            } catch (RuntimeException e) {
                // A walk-in sale reaches here AFTER Paystack has collected the money
                // (verifyWalkInCashPayment), so refusing the sale now would take payment and
                // hand over nothing. Record the sale and flag the shortfall for stock to
                // reconcile instead.
                System.err.println("STOCK SHORTFALL on sales order " + order.getSalesReference()
                        + " (product " + dto.getProductInfo().getProductId() + ", branch " + order.getBranchId()
                        + "): " + e.getMessage() + " - sale recorded anyway, stock needs reconciling.");
            }
        }

        SalesOrder savedOrder = salesOrderRepository.save(order);
        createOrderItemForSalesOrder(savedOrder);
        return savedOrder;
    }

    // Phase 2 of the order/SalesOrder unification: gives every walk-in/online
    // SalesOrder a real OrderItem row (see OrderItem.salesOrderId), alongside the
    // flat product_name/unit_price/quantity columns SalesOrder already carries -
    // those stay the read-path source of truth until Phase 3 cuts reports over.
    // A SalesOrder is always single-line-item today, so this creates at most one row.
    // Also used by the Phase 3 historical backfill (backfillOrderItemAndInstallmentPlanShadows).
    private void createOrderItemForSalesOrder(SalesOrder order) {
        if (order.getProductId() == null) {
            return; // no numeric product id to attach (see SalesOrder.productId backfill note above)
        }

        OrderItem item = new OrderItem();
        item.setSalesOrderId(order.getId());
        item.setProductId(order.getProductId());
        item.setProductName(order.getProductName());
        item.setUnitPrice(order.getUnitPrice() != null ? order.getUnitPrice().doubleValue() : 0.0);
        item.setQuantity(order.getQuantity() != null ? order.getQuantity() : 1);
        double subtotal = item.getUnitPrice() * item.getQuantity();
        double discount = order.getDiscount() != null ? order.getDiscount().doubleValue() : 0.0;
        item.setSubtotal(subtotal);
        item.setDiscount(discount);
        item.setTotal(subtotal - discount);
        orderItemRepository.save(item);
    }

    /**
     * Decrements stock for a given product, preferring stock allocated to the given
     * branch but falling back to central (unallocated) stock. Products are a universal,
     * company-wide catalogue - not owned by any branch (see Product's own class comment) -
     * so a branch having no stock row of its own must not block a sale of it; only run
     * out entirely, at both the branch and centrally, blocks it.
     * Throws RuntimeException if stock is not found or insufficient — callers are @Transactional so it rolls back.
     */
    private void decrementBranchStock(Long productId, Long branchId, int quantity) {
        Stock stock = stockRepository.findByProductIdAndBranchId(productId, branchId)
                .or(() -> stockRepository.findByProductIdAndBranchIdIsNull(productId))
                .orElseThrow(() -> new RuntimeException(
                        "No stock found for product " + productId + ". Ensure stock has been added before selling."));
        if (stock.getQuantity() < quantity) {
            throw new RuntimeException(
                    "Insufficient stock for product " + productId
                            + ". Available: " + stock.getQuantity() + ", Requested: " + quantity);
        }
        stock.setQuantity(stock.getQuantity() - quantity);
        stockRepository.save(stock);
    }

    private LoanDetails createLoanDetails(SalesOrder order, LoanInfoDto loanInfo) {
        LoanDetails loan = new LoanDetails();
        loan.setSalesOrder(order);
        // Link the loan to the customer account (walk-in customers are keyed by account
        // number) so the loan is visible on the customer's account, not just the order.
        loan.setAccountNumber(order.getAccountNumber());
        loan.setCustomerName(order.getCustomerName());
        loan.setLoanType(loanInfo.getLoanType());
        loan.setProductAmount(loanInfo.getProductAmount());
        loan.setRepaymentMethod(loanInfo.getRepaymentMethod());
        loan.setDuration(loanInfo.getDuration());
        loan.setRate(loanInfo.getRate());
        loan.setInterestOnLoan(loanInfo.getInterestOnLoan());
        loan.setPrincipalRepayment(loanInfo.getPrincipalRepayment());
        loan.setOfficerInCharge(loanInfo.getOfficerInCharge());
        loan.setUpfrontCharges(loanInfo.getUpfrontCharges());

        // Parse dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (loanInfo.getStartDate() != null) {
            loan.setStartDate(LocalDate.parse(loanInfo.getStartDate(), formatter));
        }
        if (loanInfo.getExpirationDate() != null) {
            loan.setExpirationDate(LocalDate.parse(loanInfo.getExpirationDate(), formatter));
        }

        // Calculate total repayment. A null interestOnLoan (a plain interest-free
        // installment split, e.g. "pay in 2") must not leave totalRepayment unset - see
        // ORDERING #5: createInstallmentPlanShadow below then falls back to
        // BigDecimal.ZERO for its grandTotal, which permanently pins
        // resolveInstallmentPlanProgress's paymentPercentage at 0% (it only computes a
        // percentage when grandTotal > 0) no matter how much of the order actually gets
        // paid, so it can never pass markAsPaid's 50%-paid gate and never shows as paid.
        if (loanInfo.getProductAmount() != null) {
            BigDecimal interest = loanInfo.getInterestOnLoan() != null ? loanInfo.getInterestOnLoan() : BigDecimal.ZERO;
            loan.setTotalRepayment(loanInfo.getProductAmount().add(interest));
        }

        return loan;
    }

    // Phase 2 of the order/SalesOrder unification: shadows the walk-in/online credit
    // sale's LoanDetails onto an InstallmentPlan (see InstallmentPlan.salesOrderId),
    // the same financing model the mobile app uses, so it can eventually become the
    // single canonical one (Phase 4). installmentAmount/numberOfInstallments aren't
    // known yet at this point (no schedule exists until generateRepaymentSchedule runs,
    // same as LoanRepaymentEntry) - generateRepaymentSchedule fills them in once it does.
    private void createInstallmentPlanShadow(SalesOrder order, LoanDetails loan) {
        InstallmentPlan plan = new InstallmentPlan();
        plan.setSalesOrderId(order.getId());
        plan.setUserId(order.getCustomerId() != null ? order.getCustomerId() : 0L);
        plan.setTotalAmount(loan.getProductAmount() != null ? loan.getProductAmount().doubleValue() : 0.0);
        plan.setInsuranceAmount(0.0); // no mobile-style insurance concept on a walk-in loan
        BigDecimal grandTotal = loan.getTotalRepayment() != null ? loan.getTotalRepayment() : BigDecimal.ZERO;
        plan.setGrandTotal(grandTotal.doubleValue());
        plan.setDownPayment(0.0); // no separate down payment - the first entry IS the first installment
        plan.setRemainingBalance(grandTotal.doubleValue());
        plan.setInstallmentAmount(0.0); // filled in by generateRepaymentSchedule
        plan.setFrequency("WEEKLY".equalsIgnoreCase(loan.getRepaymentMethod())
                || "BI-WEEKLY".equalsIgnoreCase(loan.getRepaymentMethod())
                ? InstallmentFrequency.WEEKLY : InstallmentFrequency.MONTHLY);
        plan.setNumberOfInstallments(0); // filled in by generateRepaymentSchedule
        plan.setStatus(InstallmentStatus.ACTIVE);
        plan.setStartDate(loan.getStartDate());
        installmentPlanRepository.save(plan);
    }

    // ==================== ORDER MANAGEMENT ====================

    @Transactional
    public SalesOrder markAsPaid(Long orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Same reasoning as the guard in initializeOrderInstallmentPayment: this only ever
        // writes isPaid/paidAt/status onto the SalesOrder mirror, never onto the real
        // mobile Order/InstallmentPlan those fields shadow, so calling it on a
        // channel=MOBILE order would let the admin side show "paid" while the mobile app
        // and InstallmentService still show a balance owed. Mobile orders can only be
        // completed through their own real payment flow.
        if (order.getChannel() == SalesChannel.MOBILE) {
            throw new RuntimeException(
                    "This order was placed through the mobile app and is paid off there - "
                            + "it can't be marked paid from the admin/sales side.");
        }

        BigDecimal paymentPercentage = BigDecimal.valueOf(100);

        // For loan-based (walk-in) orders, check that at least 50% has been paid -
        // resolved from live data, not just the LoanDetails mirror, so this gate can't be
        // bypassed by a stale/failed sync (see resolvePaymentProgress). Mobile orders never
        // reach here (guarded above), but resolvePaymentProgress still branches on them
        // for the other callers that share it (getIncompletePayments, getPaymentDetails).
        PaymentProgress progress = resolvePaymentProgress(order);
        if (progress.hasSchedule) {
            paymentPercentage = progress.paymentPercentage;

            if (paymentPercentage.compareTo(BigDecimal.valueOf(50)) < 0) {
                throw new RuntimeException(
                        "Cannot mark as paid: only " + paymentPercentage + "% has been paid. Minimum 50% required.");
            }
        }

        order.setIsPaid(true);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        order.setPaymentProgress(paymentPercentage);

        SalesOrder savedOrder = salesOrderRepository.save(order);

        // Leave an artefact behind. Flipping isPaid with nothing in `payments` made
        // "orders marked paid" impossible to reconcile against money actually received.
        recordOffSystemSettlement(savedOrder, "Marked paid by sales/admin");

        createNotification(savedOrder, NotificationType.ORDERLIST,
                "Payment confirmed for order by " + savedOrder.getCustomerName()
                        + " (" + paymentPercentage + "% paid)");

        return savedOrder;
    }

    /** Records a Paystack-collected payment against a walk-in sale. Idempotent on the reference. */
    private void recordGatewaySettlement(SalesOrder order, BigDecimal amount, String reference) {
        try {
            if (reference == null || paymentRepository.findByPaymentReference(reference).isPresent()) {
                return;
            }
            Payment payment = new Payment();
            payment.setSalesOrderId(order.getId());
            payment.setUserId(order.getCustomerId());
            payment.setAmount(amount != null ? amount.doubleValue() : 0d);
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaymentReference(reference);
            payment.setPaidAt(LocalDateTime.now());
            payment.setBranchId(order.getBranchId());
            paymentRepository.save(payment);
        } catch (Exception e) {
            System.err.println("Could not record gateway payment " + reference + " for sales order "
                    + order.getId() + ": " + e.getMessage());
        }
    }

    /**
     * Records a Payment row for a sale settled outside the gateway (cash at the counter,
     * transfer confirmed by the cashier, an admin settling an order). Skipped when the
     * sale already has a payment - a Paystack-collected sale records its own, with the
     * real gateway reference.
     */
    private void recordOffSystemSettlement(SalesOrder order, String note) {
        try {
            if (!paymentRepository.findBySalesOrderId(order.getId()).isEmpty()) {
                return;
            }
            BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            Payment payment = new Payment();
            payment.setSalesOrderId(order.getId());
            payment.setUserId(order.getCustomerId());
            payment.setAmount(total.doubleValue());
            // No gateway was involved; BANK_TRANSFER is the closest of the four methods
            // for "settled off-system", and the reference says how it was recorded.
            payment.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaymentReference("MANUAL-" + order.getId() + "-"
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            payment.setPaidAt(LocalDateTime.now());
            payment.setFailureReason(null);
            payment.setBranchId(order.getBranchId());
            paymentRepository.save(payment);
            System.out.println("Recorded off-system settlement for sales order "
                    + order.getSalesReference() + " (" + note + ")");
        } catch (Exception e) {
            System.err.println("Could not record settlement artefact for sales order "
                    + order.getId() + ": " + e.getMessage());
        }
    }

    // Settles an existing incomplete order in a single one-off payment: folds in any
    // extra charges (insurance/delivery/VAT) entered at settlement time, then marks the
    // order paid. Unlike createOneOffOrder, this does not spawn a new SalesOrder - it
    // closes out the one the caller selected, so it drops out of incomplete-payments.
    @Transactional
    public SalesOrder settleOneOffOrder(Long orderId, OneOffSettlementDto dto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (Boolean.TRUE.equals(order.getIsPaid())) {
            throw new RuntimeException("Order has already been paid");
        }

        BigDecimal insurance = (dto != null && dto.getInsurance() != null) ? dto.getInsurance() : BigDecimal.ZERO;
        BigDecimal delivery = (dto != null && dto.getDeliveryCharges() != null) ? dto.getDeliveryCharges() : BigDecimal.ZERO;
        BigDecimal vat = (dto != null && dto.getVat() != null) ? dto.getVat() : BigDecimal.ZERO;
        BigDecimal extraCharges = insurance.add(delivery).add(vat);

        BigDecimal currentTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        order.setTotalAmount(currentTotal.add(extraCharges));

        order.setIsPaid(true);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        order.setPaymentProgress(BigDecimal.valueOf(100));

        SalesOrder savedOrder = salesOrderRepository.save(order);

        // Same reason as markAsPaid: the settlement has to leave a trace in `payments`.
        recordOffSystemSettlement(savedOrder, "One-off order settled by sales/admin");

        createNotification(savedOrder, NotificationType.ORDERLIST,
                "One-off payment settled for order by " + savedOrder.getCustomerName());

        return savedOrder;
    }

    @Transactional
    public SalesOrder processRefund(Long orderId, RefundDto refundDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Guard: refund cannot be processed after goods have been dispatched
        if (DISPATCHED_STATUSES.contains(order.getStatus())) {
            throw new RuntimeException("Cannot process refund: goods have already been dispatched (status: " + order.getStatus() + ")");
        }
        if (Boolean.TRUE.equals(order.getIsRefunded())) {
            throw new RuntimeException("Order has already been refunded");
        }

        // Calculate total amount the customer has paid
        BigDecimal totalPaid;
        if (order.getLoanDetails() != null) {
            totalPaid = loanRepaymentEntryRepository
                    .sumAmountPaidByLoanDetailsId(order.getLoanDetails().getId());
        } else {
            // For non-loan orders (ONE_OFF/CASH), customer paid the full amount
            totalPaid = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        }

        // Apply 10% charge on the total paid amount
        BigDecimal charge = totalPaid.multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal refundAmount = totalPaid.subtract(charge);

        order.setIsRefunded(true);
        order.setRefundedAt(LocalDateTime.now());
        order.setRefundAmount(refundAmount);
        order.setRefundReason(refundDto.getReason());
        order.setStatus(OrderStatus.REFUNDED);

        // Create notification
        createNotification(order, NotificationType.REFUND,
                "Refund processed for " + refundDto.getProductReference()
                        + ". Total paid: " + totalPaid + ", 10% charge: " + charge + ", Refund amount: " + refundAmount);

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder cancelSalesOrder(Long orderId, CancelOrderDto cancelDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
            throw new RuntimeException("Order is already " + order.getStatus());
        }
        // A fully paid order has to go through the refund flow instead of cancellation.
        if (Boolean.TRUE.equals(order.getIsPaid())) {
            throw new RuntimeException("Cannot cancel an order that has already been fully paid");
        }

        BigDecimal amountPaid = order.getLoanDetails() != null
                ? loanRepaymentEntryRepository.sumAmountPaidByLoanDetailsId(order.getLoanDetails().getId())
                : BigDecimal.ZERO;

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(cancelDto.getReason());

        String notificationMessage = "Order cancelled: " + cancelDto.getReason();

        // Refund whatever the customer has paid so far back to their wallet.
        if (amountPaid != null && amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            FundWalletDto refundDto = new FundWalletDto();
            refundDto.setCustomerId(order.getCustomerId());
            refundDto.setAccountNumber(order.getAccountNumber());
            refundDto.setAmount(amountPaid.doubleValue());
            refundDto.setDescription("Refund for cancelled order " + order.getReferenceNo());

            BaseResponse refundResult = walletService.fundCustomerWallet(refundDto);
            if (refundResult != null && refundResult.getStatus() == 200) {
                order.setRefundAmount(amountPaid);
                order.setRefundedAt(LocalDateTime.now());
                order.setIsRefunded(true);
                notificationMessage += String.format(" | Refunded %s to customer wallet", amountPaid);
            } else {
                String failureReason = refundResult != null ? refundResult.getMessage() : "unknown error";
                log.warn("Wallet refund of {} for cancelled order {} failed: {}",
                        amountPaid, order.getId(), failureReason);
                notificationMessage += " | Wallet refund failed, needs manual follow-up";
            }
        }

        // Create notification
        createNotification(order, NotificationType.CANCELLED, notificationMessage);

        return salesOrderRepository.save(order);
    }

    public SalesOrder getOrderDetails(Long orderId) {
        return salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // ==================== CANCELLATION REQUESTS (customer -> sales -> admin) ====================
    //
    // Two distinct origins feed the same admin approval queue, kept on separate tabs on the
    // "Cancel Order" screen since an online and a walk-in customer's orders must never be
    // mixed in one list:
    //  - ONLINE: the customer requests cancellation from the mobile app
    //    (OrderService.requestCancellation), which flags the order CANCELLATION_REQUESTED.
    //    Sales then either forwards it to admin (PENDING_CANCELLATION_APPROVAL) or rejects it
    //    outright, restoring the order to whatever status it had before the request
    //    (preCancellationStatus).
    //  - WALKIN: there is no customer self-service request, so sales raises the request
    //    directly (createWalkInCancellationRequest) - it goes straight to
    //    PENDING_CANCELLATION_APPROVAL, skipping the CANCELLATION_REQUESTED review step.
    // Either way, only the admin's final approval actually cancels the order and refunds the
    // customer's wallet.

    // Online Customers tab: real cancellation requests awaiting sales review.
    public Page<SalesOrder> getCancellationRequests(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findByCustomerTypeAndStatus(
                CustomerType.ONLINE, OrderStatus.CANCELLATION_REQUESTED, pageable);
    }

    // Walk-in Customers tab: orders sales can raise a cancellation request for.
    public Page<SalesOrder> getWalkInCancellableOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<OrderStatus> excludedStatuses = List.of(
                OrderStatus.CANCELLED, OrderStatus.REFUNDED,
                OrderStatus.CANCELLATION_REQUESTED, OrderStatus.PENDING_CANCELLATION_APPROVAL);
        return salesOrderRepository.findByCustomerTypeAndIsPaidFalseAndStatusNotIn(
                CustomerType.WALKIN, excludedStatuses, pageable);
    }

    // Admin's queue: cancellations forwarded by sales (online) or raised by sales (walk-in),
    // both awaiting the final decision.
    public Page<SalesOrder> getPendingCancellationApprovals(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findByStatus(OrderStatus.PENDING_CANCELLATION_APPROVAL, pageable);
    }

    // Sales raises a cancellation request on behalf of a walk-in customer (no mobile app for
    // them to request through themselves). Skips straight to PENDING_CANCELLATION_APPROVAL -
    // sales is both the requester and the first reviewer here, so there is no separate party
    // left to forward it past. Same 50%-paid gate as the online customer's own request.
    @Transactional
    public SalesOrder createWalkInCancellationRequest(Long orderId, String reason) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getCustomerType() != CustomerType.WALKIN) {
            throw new RuntimeException("This order does not belong to a walk-in customer");
        }
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED
                || order.getStatus() == OrderStatus.CANCELLATION_REQUESTED
                || order.getStatus() == OrderStatus.PENDING_CANCELLATION_APPROVAL) {
            throw new RuntimeException("This order is already " + order.getStatus());
        }
        if (Boolean.TRUE.equals(order.getIsPaid())) {
            throw new RuntimeException("Cannot cancel an order that has already been fully paid - use the refund flow instead");
        }

        PaymentProgress progress = resolvePaymentProgress(order);
        if (progress.hasSchedule && progress.paymentPercentage.compareTo(BigDecimal.valueOf(50)) >= 0) {
            throw new RuntimeException("Cannot request cancellation: " + progress.paymentPercentage
                    + "% has already been paid. Minimum required is under 50% - use the refund flow instead.");
        }

        order.setPreCancellationStatus(order.getStatus());
        order.setStatus(OrderStatus.PENDING_CANCELLATION_APPROVAL);
        order.setCancellationReason(reason);
        SalesOrder saved = salesOrderRepository.save(order);

        createNotification(saved, NotificationType.CANCELLED,
                "Sales requested cancellation for walk-in order " + saved.getReferenceNo()
                        + " (" + saved.getCustomerName() + ") - awaiting admin approval");

        return saved;
    }

    // Sales forwards a customer's cancellation request to admin for a final decision.
    @Transactional
    public SalesOrder forwardCancellationToAdmin(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.CANCELLATION_REQUESTED) {
            throw new RuntimeException("This order has no pending cancellation request to forward");
        }

        order.setStatus(OrderStatus.PENDING_CANCELLATION_APPROVAL);
        if (decisionDto != null && decisionDto.getComment() != null) {
            order.setComment(decisionDto.getComment());
        }
        SalesOrder saved = salesOrderRepository.save(order);

        if (saved.getMobileOrderId() != null) {
            orderRepository.findById(saved.getMobileOrderId()).ifPresent(mobileOrder -> {
                mobileOrder.setOrderStatus(OrderStatus.PENDING_CANCELLATION_APPROVAL);
                orderRepository.save(mobileOrder);
            });
        }

        markCancellationNotificationsActioned(saved.getId());
        createNotification(saved, NotificationType.CANCELLED,
                "Cancellation request for order by " + saved.getCustomerName() + " forwarded to admin for approval");

        return saved;
    }

    // Rejects a pending cancellation request - callable by sales (while CANCELLATION_REQUESTED)
    // or by admin (while PENDING_CANCELLATION_APPROVAL) - and restores the order to whatever
    // status it had before the request was made. The order itself is untouched otherwise.
    @Transactional
    public SalesOrder rejectCancellationRequest(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.CANCELLATION_REQUESTED
                && order.getStatus() != OrderStatus.PENDING_CANCELLATION_APPROVAL) {
            throw new RuntimeException("This order has no pending cancellation request to reject");
        }

        OrderStatus restoreTo = order.getPreCancellationStatus() != null
                ? order.getPreCancellationStatus() : OrderStatus.PENDING;
        order.setStatus(restoreTo);
        order.setPreCancellationStatus(null);
        SalesOrder saved = salesOrderRepository.save(order);

        if (saved.getMobileOrderId() != null) {
            orderRepository.findById(saved.getMobileOrderId()).ifPresent(mobileOrder -> {
                OrderStatus mobileRestoreTo = mobileOrder.getPreCancellationStatus() != null
                        ? mobileOrder.getPreCancellationStatus() : OrderStatus.PENDING;
                mobileOrder.setOrderStatus(mobileRestoreTo);
                mobileOrder.setPreCancellationStatus(null);
                mobileOrder.setCancellationReason(null);
                orderRepository.save(mobileOrder);
            });
        }

        String reason = decisionDto != null && decisionDto.getComment() != null
                ? decisionDto.getComment() : "not eligible for cancellation";
        markCancellationNotificationsActioned(saved.getId());
        createNotification(saved, NotificationType.CANCELLED,
                "Cancellation request for order by " + saved.getCustomerName() + " was declined: " + reason);

        return saved;
    }

    // Admin's final sign-off on a cancellation sales forwarded: cancels the order for real
    // and refunds whatever the customer already paid back to their wallet. For orders mirrored
    // from the mobile app, reads/updates the real Order + Payment rows directly (not the
    // LoanDetails mirror) so the refund reflects what was actually charged - same reasoning
    // as resolvePaymentProgress.
    @Transactional
    public SalesOrder approveCancellation(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING_CANCELLATION_APPROVAL) {
            throw new RuntimeException("This order has no cancellation request awaiting admin approval");
        }

        double amountRefunded = 0;
        if (order.getMobileOrderId() != null) {
            Order mobileOrder = orderRepository.findById(order.getMobileOrderId())
                    .orElseThrow(() -> new RuntimeException("Mobile order not found for this sales order"));

            List<Payment> completedPayments = paymentRepository.findByOrderId(mobileOrder.getId()).stream()
                    .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                    .collect(java.util.stream.Collectors.toList());
            double amountPaid = completedPayments.stream().mapToDouble(Payment::getAmount).sum();

            mobileOrder.setOrderStatus(OrderStatus.CANCELLED);
            mobileOrder.setCancelledAt(LocalDateTime.now());
            mobileOrder.setPreCancellationStatus(null);
            orderRepository.save(mobileOrder);

            if (amountPaid > 0) {
                com.appGate.account.response.BaseResponse creditResponse = walletService.creditWallet(
                        mobileOrder.getUserId(), amountPaid, "Refund for cancelled order " + mobileOrder.getOrderNumber());
                if (creditResponse.getStatus() == 200) {
                    completedPayments.forEach(p -> p.setStatus(PaymentStatus.REFUNDED));
                    paymentRepository.saveAll(completedPayments);
                    amountRefunded = amountPaid;
                } else {
                    log.warn("Wallet refund of {} for cancelled order {} failed: {}",
                            amountPaid, mobileOrder.getId(), creditResponse.getMessage());
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setPreCancellationStatus(null);
        if (amountRefunded > 0) {
            order.setIsRefunded(true);
            order.setRefundAmount(BigDecimal.valueOf(amountRefunded));
            order.setRefundedAt(LocalDateTime.now());
        }
        if (decisionDto != null && decisionDto.getComment() != null) {
            order.setComment(decisionDto.getComment());
        }
        SalesOrder saved = salesOrderRepository.save(order);

        markCancellationNotificationsActioned(saved.getId());
        createNotification(saved, NotificationType.CANCELLED,
                "Order cancellation approved for " + saved.getCustomerName()
                        + (amountRefunded > 0
                                ? String.format(" | %.2f refunded to customer wallet", amountRefunded)
                                : ""));

        return saved;
    }

    private void markCancellationNotificationsActioned(Long salesOrderId) {
        List<SalesNotification> pending = salesNotificationRepository
                .findBySalesOrderIdAndNotificationTypeAndIsActionedFalse(salesOrderId, NotificationType.CANCELLED);
        pending.forEach(n -> n.setIsActioned(true));
        salesNotificationRepository.saveAll(pending);
    }

    // ==================== SALES REFERENCE ====================

    // Generate (once) and persist a backend sales reference for an order. Idempotent:
    // if the order already has one, the existing reference is returned unchanged.
    @Transactional
    public SalesOrder generateSalesReference(Long orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getSalesReference() == null || order.getSalesReference().isBlank()) {
            String reference;
            do {
                reference = "SLS-" + orderId + "-"
                        + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            } while (salesOrderRepository.existsBySalesReference(reference));
            order.setSalesReference(reference);
            order = salesOrderRepository.save(order);
        }
        return order;
    }

    // ==================== ONLINE ORDER APPROVAL ====================

    // Forwards an online order for admin sign-off: moves it to APPROVED (not PROCESSING -
    // that only happens once an admin reviews it on the Online Sales Approvals screen, which
    // reads orders in this exact status).
    @Transactional
    public SalesOrder submitOrderForApproval(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (DISPATCHED_STATUSES.contains(order.getStatus())
                || order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.REFUNDED) {
            throw new RuntimeException("Cannot submit an order that is already "
                    + order.getStatus());
        }

        order.setStatus(OrderStatus.APPROVED);
        if (decisionDto != null && decisionDto.getComment() != null) {
            order.setComment(decisionDto.getComment());
        }
        SalesOrder savedOrder = salesOrderRepository.save(order);
        createNotification(savedOrder, NotificationType.ORDERLIST,
                "Order submitted for admin approval: " + savedOrder.getCustomerName());
        return savedOrder;
    }

    // Approve an online order that is awaiting fulfilment: moves it into PROCESSING.
    @Transactional
    public SalesOrder approveOrder(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (DISPATCHED_STATUSES.contains(order.getStatus())
                || order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.REFUNDED) {
            throw new RuntimeException("Cannot approve an order that is already "
                    + order.getStatus());
        }

        order.setStatus(OrderStatus.PROCESSING);
        if (decisionDto != null && decisionDto.getComment() != null) {
            order.setComment(decisionDto.getComment());
        }
        return salesOrderRepository.save(order);
    }

    // Reject an online order: reverses whatever the customer already paid back into their
    // wallet, then cancels the order recording the reviewer's reason.
    @Transactional
    public SalesOrder rejectOrder(Long orderId, OrderDecisionDto decisionDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (DISPATCHED_STATUSES.contains(order.getStatus())
                || order.getStatus() == OrderStatus.REFUNDED) {
            throw new RuntimeException("Cannot reject an order that is already "
                    + order.getStatus());
        }

        // customerId is only populated on mobile-app orders (the mirror sync sets it to the
        // app user's id, which is also how their wallet is keyed) - staff-entered orders have
        // no wallet to refund into, so this is a no-op for those.
        if (Boolean.TRUE.equals(order.getIsPaid()) && order.getCustomerId() != null) {
            BigDecimal amountPaid;
            if (order.getLoanDetails() != null) {
                BigDecimal paid = loanRepaymentEntryRepository.sumAmountPaidByLoanDetailsId(order.getLoanDetails().getId());
                amountPaid = paid != null ? paid : BigDecimal.ZERO;
            } else {
                amountPaid = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            }
            if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
                com.appGate.account.response.BaseResponse refund = walletService.creditWallet(
                        order.getCustomerId(), amountPaid.doubleValue(),
                        "Refund for rejected order " + order.getReferenceNo());

                // creditWallet keys on userId. For a walk-in or staff-entered order,
                // customerId is a Customer id, not a user id, so that lookup finds nothing
                // - and the failure used to be discarded, cancelling the order with the
                // customer's money still held. Fall back to the customerId-keyed path
                // (the same one cancelSalesOrder uses) and shout if it still fails.
                if (refund == null || refund.getStatus() != 200) {
                    com.appGate.account.dto.FundWalletDto fw = new com.appGate.account.dto.FundWalletDto();
                    fw.setCustomerId(order.getCustomerId());
                    fw.setAmount(amountPaid.doubleValue());
                    fw.setFundingMethod("REFUND");
                    fw.setDescription("Refund for rejected order " + order.getReferenceNo());
                    refund = walletService.fundCustomerWallet(fw);
                }
                if (refund == null || refund.getStatus() != 200) {
                    throw new RuntimeException("Order not rejected: the refund of " + amountPaid
                            + " could not be paid back to the customer ("
                            + (refund != null ? refund.getMessage() : "no response")
                            + "). Resolve the refund first.");
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        String reason = decisionDto != null && decisionDto.getComment() != null
                ? decisionDto.getComment()
                : "Rejected during online sales review";
        order.setCancellationReason(reason);
        createNotification(order, NotificationType.CANCELLED, "Order rejected: " + reason);
        return salesOrderRepository.save(order);
    }

    public SalesOrder getOrderByReferenceNo(String referenceNo) {
        return salesOrderRepository.findByReferenceNo(referenceNo)
                .orElseThrow(() -> new RuntimeException("Order not found with reference: " + referenceNo));
    }

    // Admin-approved online orders available for the Rider Box Management "Order Reference"
    // picker. See SalesOrderRepository.findOrdersReadyForRiderAssignment for the exact scope.
    public Page<SalesOrder> getOrdersReadyForRider(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findOrdersReadyForRiderAssignment(pageable);
    }

    // ==================== PAYMENT TRACKING ====================

    /**
     * Payment progress for a SalesOrder, resolved by {@link #resolvePaymentProgress}
     * from whichever side actually holds the truth for that order.
     */
    private static class PaymentProgress {
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal paymentPercentage = BigDecimal.ZERO;
        int totalRecords = 0;
        int paidRecords = 0;
        int pendingRecords = 0;
        int overdueRecords = 0;
        LocalDate nextDueDate;
        List<RepaymentEntryDetailDto> entries = new ArrayList<>();
        // True only when this order actually has a repayment schedule (loan-based
        // walk-in order, or a mobile installment order) - false for a plain one-off
        // order, which has no partial-payment concept at all. markAsPaid uses this to
        // decide whether the 50%-paid gate applies.
        boolean hasSchedule = false;
    }

    /**
     * Resolves payment progress for a SalesOrder. For a mobile-originated order
     * (mobileOrderId != null) with an installment plan, reads live from the mobile-side
     * InstallmentPlan/Installment/Order tables instead of the LoanDetails/
     * LoanRepaymentEntry mirror - that mirror is maintained by
     * {@link MobileSalesOrderSyncService}, which swallows its own sync failures
     * (try/catch + log.error, never surfaced), so it can silently lag or never update
     * at all. This is the fix for the incident where a customer's mobile app showed a
     * 50% down payment paid while every admin payment-tracking screen showed 0%: the
     * mirror simply never got the update, even though the real payment tables did.
     * Walk-in/admin-created orders (no mobileOrderId, or no installment plan attached)
     * have no mobile-side counterpart, so they keep using the LoanDetails mirror, which
     * is the actual source of truth for those.
     */
    // Sum of amounts actually paid across a customer's CREDIT/INSTALLMENT orders,
    // resolved per-order via resolvePaymentProgress so it's correct for both walk-in
    // orders (LoanDetails/InstallmentPlan shadow) and mobile-mirrored orders (reads
    // live from the mobile-side InstallmentPlan/Installment tables rather than the
    // mirror, which can lag). Used by CustomerService's credit/loan-recovery reports
    // instead of summing every Payment row for the customer's userId - that summed
    // payments for one-off/cash orders and orderless direct payments too, which have
    // nothing to do with credit recovered (see CLIENT #3/#5 tally investigation).
    public BigDecimal getRecoveredAmountForCreditOrders(Long customerId) {
        List<SalesOrder> creditOrders = salesOrderRepository.findByCustomerId(customerId, Pageable.unpaged())
                .getContent().stream()
                .filter(o -> o.getOrderType() == SalesOrderType.CREDIT || o.getOrderType() == SalesOrderType.INSTALLMENT)
                .filter(o -> !Boolean.TRUE.equals(o.getIsRefunded()))
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.FAILED)
                .toList();

        BigDecimal recovered = BigDecimal.ZERO;
        for (SalesOrder order : creditOrders) {
            recovered = recovered.add(resolvePaymentProgress(order).totalPaid);
        }
        return recovered;
    }

    private PaymentProgress resolvePaymentProgress(SalesOrder order) {
        if (order.getMobileOrderId() != null) {
            List<InstallmentPlan> plans = installmentPlanRepository.findByOrderId(order.getMobileOrderId());
            if (!plans.isEmpty()) {
                return resolveMobileInstallmentProgress(order, plans.get(0));
            }
        }
        // Phase 3 of the order/SalesOrder unification: prefer the InstallmentPlan/
        // Installment shadow (kept in sync by the Phase 2 dual-write - see
        // syncInstallmentPlanSchedule/markShadowInstallmentPaid) over the LoanDetails/
        // LoanRepaymentEntry mirror it shadows, since InstallmentPlan/Installment is the
        // canonical financing model going forward. Falls back to LoanDetails for any
        // order whose shadow has no schedule yet (e.g. generateRepaymentSchedule was
        // never triggered) - amounts are identical either way since one is a copy of
        // the other, so this is a safe, behavior-preserving cutover.
        Optional<InstallmentPlan> shadowPlan = installmentPlanRepository.findBySalesOrderId(order.getId());
        if (shadowPlan.isPresent() && !installmentRepository.findByInstallmentPlanId(shadowPlan.get().getId()).isEmpty()) {
            return resolveInstallmentPlanProgress(order, shadowPlan.get());
        }
        return resolveLoanDetailsProgress(order);
    }

    private PaymentProgress resolveInstallmentPlanProgress(SalesOrder order, InstallmentPlan plan) {
        PaymentProgress progress = new PaymentProgress();
        progress.hasSchedule = true;

        List<Installment> installments = installmentRepository.findByInstallmentPlanId(plan.getId()).stream()
                .sorted(java.util.Comparator.comparing(Installment::getInstallmentNumber))
                .collect(java.util.stream.Collectors.toList());

        progress.totalRecords = installments.size();
        for (Installment installment : installments) {
            BigDecimal amountDue = installment.getAmountDue() != null ? BigDecimal.valueOf(installment.getAmountDue()) : BigDecimal.ZERO;
            BigDecimal amountPaid = installment.getAmountPaid() != null ? BigDecimal.valueOf(installment.getAmountPaid()) : BigDecimal.ZERO;

            if (installment.getStatus() == InstallmentStatus.PAID) {
                progress.totalPaid = progress.totalPaid.add(amountPaid);
                progress.paidRecords++;
            } else if (installment.getStatus() == InstallmentStatus.OVERDUE) {
                progress.overdueRecords++;
            } else {
                progress.pendingRecords++;
            }

            boolean isPaid = installment.getStatus() == InstallmentStatus.PAID;
            Payment linkedPayment = installment.getPaymentId() != null
                    ? paymentRepository.findById(installment.getPaymentId()).orElse(null) : null;

            progress.entries.add(RepaymentEntryDetailDto.builder()
                    .entryNumber(installment.getInstallmentNumber())
                    .amountDue(amountDue)
                    .amountPaid(amountPaid)
                    .dueDate(installment.getDueDate())
                    .paidDate(installment.getPaidDate())
                    .status(installment.getStatus() != null ? installment.getStatus().name() : "PENDING")
                    .date(isPaid && installment.getPaidDate() != null ? installment.getPaidDate() : installment.getDueDate())
                    .amount(isPaid ? amountPaid : amountDue)
                    .method(linkedPayment != null && linkedPayment.getPaymentMethod() != null
                            ? linkedPayment.getPaymentMethod().name() : null)
                    .reference(linkedPayment != null ? linkedPayment.getPaymentReference() : null)
                    .build());
        }

        progress.nextDueDate = installments.stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PENDING)
                .map(Installment::getDueDate)
                .findFirst()
                .orElse(null);

        BigDecimal planTotal = BigDecimal.valueOf(plan.getGrandTotal());
        if (planTotal.compareTo(BigDecimal.ZERO) > 0) {
            progress.paymentPercentage = progress.totalPaid
                    .multiply(BigDecimal.valueOf(100))
                    .divide(planTotal, 2, RoundingMode.HALF_UP);
        }
        return progress;
    }

    private PaymentProgress resolveLoanDetailsProgress(SalesOrder order) {
        PaymentProgress progress = new PaymentProgress();
        if (order.getLoanDetails() == null) {
            // Plain one-off order: markAsPaid/settleOneOffOrder only ever flip
            // isPaid/paidAt/totalAmount on the SalesOrder itself - no LoanDetails,
            // InstallmentPlan or Payment row is ever created for these, so there is no
            // schedule to read progress from. Without this, a fully paid one-off order
            // reports totalPaid=0 and an empty payment history despite genuinely being
            // paid in full. Synthesize the single settlement as one payment-history
            // entry from the fields markAsPaid/settleOneOffOrder do write.
            if (Boolean.TRUE.equals(order.getIsPaid())) {
                BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
                LocalDate paidDate = order.getPaidAt() != null ? order.getPaidAt().toLocalDate() : null;

                progress.totalRecords = 1;
                progress.paidRecords = 1;
                progress.totalPaid = totalAmount;
                progress.paymentPercentage = BigDecimal.valueOf(100);
                progress.entries.add(RepaymentEntryDetailDto.builder()
                        .entryNumber(1)
                        .amountDue(totalAmount)
                        .amountPaid(totalAmount)
                        .dueDate(paidDate)
                        .paidDate(paidDate)
                        .status("PAID")
                        .date(paidDate)
                        .amount(totalAmount)
                        .method(order.getOrderType() != null ? order.getOrderType().name() : null)
                        .reference(order.getReferenceNo())
                        .build());
            }
            return progress;
        }
        progress.hasSchedule = true;

        LoanDetails loan = order.getLoanDetails();
        List<LoanRepaymentEntry> entries = loanRepaymentEntryRepository
                .findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId());

        progress.totalRecords = entries.size();
        for (LoanRepaymentEntry entry : entries) {
            if ("PAID".equals(entry.getStatus())) {
                progress.totalPaid = progress.totalPaid.add(entry.getAmountPaid() != null ? entry.getAmountPaid() : BigDecimal.ZERO);
                progress.paidRecords++;
            } else if ("OVERDUE".equals(entry.getStatus())) {
                progress.overdueRecords++;
            } else {
                progress.pendingRecords++;
            }

            boolean isPaid = "PAID".equals(entry.getStatus());
            progress.entries.add(RepaymentEntryDetailDto.builder()
                    .entryNumber(entry.getEntryNumber())
                    .amountDue(entry.getAmountDue())
                    .amountPaid(entry.getAmountPaid())
                    .dueDate(entry.getDueDate())
                    .paidDate(entry.getPaidDate())
                    .status(entry.getStatus())
                    .date(isPaid && entry.getPaidDate() != null ? entry.getPaidDate() : entry.getDueDate())
                    .amount(isPaid ? entry.getAmountPaid() : entry.getAmountDue())
                    // No payment link on LoanRepaymentEntry (unlike Installment.paymentId) -
                    // method/reference stay null here; the frontend already shows "N/A".
                    .build());
        }

        progress.nextDueDate = entries.stream()
                .filter(e -> "PENDING".equals(e.getStatus()))
                .map(LoanRepaymentEntry::getDueDate)
                .findFirst()
                .orElse(null);

        BigDecimal scheduleTotal = repaymentScheduleTotal(loan, order);
        if (scheduleTotal.compareTo(BigDecimal.ZERO) > 0) {
            progress.paymentPercentage = progress.totalPaid
                    .multiply(BigDecimal.valueOf(100))
                    .divide(scheduleTotal, 2, RoundingMode.HALF_UP);
        }
        return progress;
    }

    private PaymentProgress resolveMobileInstallmentProgress(SalesOrder order, InstallmentPlan plan) {
        PaymentProgress progress = new PaymentProgress();
        progress.hasSchedule = true;

        // The down payment IS installment #1 (see InstallmentService.buildPlan) - it's
        // charged separately from InstallmentService.payInstallmentInternal's wallet
        // flow (via OrderService.payOrderByWallet or a Paystack order-level charge, see
        // PaymentGatewayService.applyDownPaymentCollected), but it's still a real,
        // numbered Installment row with its own status/paidDate/paymentId, so this loop
        // already covers it - no separate synthetic entry needed.
        List<Installment> installments = installmentRepository.findByInstallmentPlanId(plan.getId()).stream()
                .sorted(java.util.Comparator.comparing(Installment::getInstallmentNumber))
                .collect(java.util.stream.Collectors.toList());
        progress.totalRecords = installments.size();

        for (Installment installment : installments) {
            BigDecimal amountDue = installment.getAmountDue() != null ? BigDecimal.valueOf(installment.getAmountDue()) : BigDecimal.ZERO;
            BigDecimal amountPaid = installment.getAmountPaid() != null ? BigDecimal.valueOf(installment.getAmountPaid()) : BigDecimal.ZERO;
            String status = installment.getStatus() != null ? installment.getStatus().name() : "PENDING";
            boolean isPaid = installment.getStatus() == InstallmentStatus.PAID;
            Payment linkedPayment = installment.getPaymentId() != null
                    ? paymentRepository.findById(installment.getPaymentId()).orElse(null) : null;

            progress.entries.add(RepaymentEntryDetailDto.builder()
                    .entryNumber(installment.getInstallmentNumber())
                    .amountDue(amountDue)
                    .amountPaid(amountPaid)
                    .dueDate(installment.getDueDate())
                    .paidDate(installment.getPaidDate())
                    .status(status)
                    .date(isPaid && installment.getPaidDate() != null ? installment.getPaidDate() : installment.getDueDate())
                    .amount(isPaid ? amountPaid : amountDue)
                    .method(linkedPayment != null && linkedPayment.getPaymentMethod() != null
                            ? linkedPayment.getPaymentMethod().name() : null)
                    .reference(linkedPayment != null ? linkedPayment.getPaymentReference() : null)
                    .build());

            if (installment.getStatus() == InstallmentStatus.PAID) {
                progress.totalPaid = progress.totalPaid.add(amountPaid);
                progress.paidRecords++;
            } else if (installment.getStatus() == InstallmentStatus.OVERDUE) {
                progress.overdueRecords++;
                if (progress.nextDueDate == null) {
                    progress.nextDueDate = installment.getDueDate();
                }
            } else {
                progress.pendingRecords++;
                if (progress.nextDueDate == null) {
                    progress.nextDueDate = installment.getDueDate();
                }
            }
        }

        BigDecimal grandTotal = BigDecimal.valueOf(plan.getGrandTotal());
        if (grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            progress.paymentPercentage = progress.totalPaid
                    .multiply(BigDecimal.valueOf(100))
                    .divide(grandTotal, 2, RoundingMode.HALF_UP);
        }
        return progress;
    }

    public Page<IncompletePaymentDto> getIncompletePayments(int page, int size) {
        return getIncompletePayments(page, size, null, null, null);
    }

    /**
     * @param minPaymentPercentage inclusive lower bound (e.g. 50 -> ">= 50%"), or null for no lower bound
     * @param maxPaymentPercentage exclusive upper bound (e.g. 50 -> "< 50%"), or null for no upper bound
     * @param salesReferenceNull   when true/false, keeps only orders whose salesReference is null/non-null; null skips this filter
     */
    public Page<IncompletePaymentDto> getIncompletePayments(int page, int size,
            BigDecimal minPaymentPercentage, BigDecimal maxPaymentPercentage, Boolean salesReferenceNull) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<OrderStatus> excludedStatuses = List.of(OrderStatus.CANCELLED, OrderStatus.REFUNDED);

        Page<SalesOrder> orders = salesOrderRepository.findByIsPaidFalseAndStatusNotIn(excludedStatuses, pageable);

        List<IncompletePaymentDto> filtered = orders.stream()
                .map(order -> {
                    PaymentProgress progress = resolvePaymentProgress(order);

                    return IncompletePaymentDto.builder()
                            .orderId(order.getId())
                            .referenceNo(order.getReferenceNo())
                            .customerName(order.getCustomerName())
                            .accountNumber(order.getAccountNumber())
                            .productName(order.getProductName())
                            .totalAmount(order.getTotalAmount())
                            .totalPaid(progress.totalPaid)
                            .paymentPercentage(progress.paymentPercentage)
                            .salesReference(order.getSalesReference())
                            .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                            .customerType(order.getCustomerType() != null ? order.getCustomerType().name() : null)
                            .status(order.getStatus() != null ? order.getStatus().name() : null)
                            .totalInstallments(progress.totalRecords)
                            .paidInstallments(progress.paidRecords)
                            .nextDueDate(progress.nextDueDate)
                            .build();
                })
                .filter(dto -> minPaymentPercentage == null
                        || dto.getPaymentPercentage().compareTo(minPaymentPercentage) >= 0)
                .filter(dto -> maxPaymentPercentage == null
                        || dto.getPaymentPercentage().compareTo(maxPaymentPercentage) < 0)
                .filter(dto -> salesReferenceNull == null
                        || salesReferenceNull == (dto.getSalesReference() == null))
                .collect(Collectors.toList());

        return new PageImpl<>(filtered, pageable, filtered.size());
    }

    /**
     * "Order list as paid" backing query - deliberately independent of {@link #getIncompletePayments}
     * and its isPaid/status/percentage-recomputation rules, which were silently excluding orders
     * that had genuinely crossed the 50%-paid mark. Filters directly on the SalesOrder table's own
     * stored salesReference/paymentProgress columns: paymentProgress >= 50 and either no
     * salesReference yet or still under 100% paid, so a part-paid credit order stays listed
     * until it is fully paid. ONE_OFF orders are excluded - those belong to
     * {@link #getMobileOrdersPaidInFull} ("One of order").
     */
    public Page<IncompletePaymentDto> getOrdersAwaitingSalesReference(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository
                .findAwaitingSalesReference(BigDecimal.valueOf(50), BigDecimal.valueOf(100), pageable)
                .map(this::toStoredProgressDto);
    }

    /**
     * "Marking as paid" backing query - the <50% counterpart to {@link #getOrdersAwaitingSalesReference},
     * same reasoning: filters directly on SalesOrder's own stored paymentProgress column instead of
     * going through {@link #getIncompletePayments}'s isPaid/status/percentage-recomputation rules.
     */
    public Page<IncompletePaymentDto> getOrdersBelowHalfPaid(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository
                .findByPaymentProgressLessThan(BigDecimal.valueOf(50), pageable)
                .map(this::toStoredProgressDto);
    }

    /**
     * "One of order" backing query - ONE_OFF orders that still need a sales reference, i.e. exactly
     * the orders {@link #getOrdersAwaitingSalesReference} excludes, so a one-off order always sits
     * on exactly one of the two screens and moves to "Completed payments" once
     * {@link #generateSalesReference} mints its reference.
     *
     * <p>Keyed on the missing reference rather than on isPaid, because the two kinds of one-off
     * order arrive in opposite payment states: mobile orders are mirrored in already settled
     * (see {@link MobileSalesOrderSyncService#createMirror}), while staff-entered ones arrive
     * unpaid and are settled here via {@link #settleOneOffOrder}. Either way the screen's job is
     * the reference.
     */
    public Page<IncompletePaymentDto> getMobileOrdersPaidInFull(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository
                .findOneOffOrdersAwaitingSalesReference(ONE_OFF_INELIGIBLE_STATUSES, pageable)
                .map(this::toStoredProgressDto);
    }

    // Shared mapping for the three screen-specific queries above. Reports the order's own
    // stored paymentProgress as the percentage - the value those queries actually filter on -
    // so what a screen lists can never disagree with why it was listed. totalPaid and the
    // installment counts still come from resolvePaymentProgress, which reads the live
    // payment/installment records.
    private IncompletePaymentDto toStoredProgressDto(SalesOrder order) {
        PaymentProgress progress = resolvePaymentProgress(order);

        return IncompletePaymentDto.builder()
                .orderId(order.getId())
                .referenceNo(order.getReferenceNo())
                .customerName(order.getCustomerName())
                .accountNumber(order.getAccountNumber())
                .productName(order.getProductName())
                .totalAmount(order.getTotalAmount())
                .totalPaid(progress.totalPaid)
                .paymentPercentage(order.getPaymentProgress())
                .isPaid(order.getIsPaid())
                .salesReference(order.getSalesReference())
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                .customerType(order.getCustomerType() != null ? order.getCustomerType().name() : null)
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .totalInstallments(progress.totalRecords)
                .paidInstallments(progress.paidRecords)
                .nextDueDate(progress.nextDueDate)
                .build();
    }

    /**
     * "Completed payments" backing query: orders whose sales reference has already been generated
     * (see {@link #generateSalesReference}) and that have not yet been forwarded to the admin
     * approval queue. Orders still awaiting that reference belong to
     * {@link #getOrdersAwaitingSalesReference} ("Order list as paid") instead; orders already
     * forwarded belong to the admin's own approvals screen, which reads
     * {@link OrderStatus#APPROVED} - the status {@link #submitOrderForApproval} sets - so listing
     * them here too would only offer a "Send for approval" action that cannot do anything.
     */
    public Page<CompletedPaymentDto> getCompletedPayments(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SalesOrder> orders = salesOrderRepository
                .findReferencedOrdersNotYetSubmittedForApproval(FORWARDED_FOR_APPROVAL_STATUSES, pageable);

        return orders.map(order -> {
            PaymentProgress progress = resolvePaymentProgress(order);

            return CompletedPaymentDto.builder()
                    .orderId(order.getId())
                    .referenceNo(order.getReferenceNo())
                    .customerName(order.getCustomerName())
                    .accountNumber(order.getAccountNumber())
                    .productName(order.getProductName())
                    .totalAmount(order.getTotalAmount())
                    .totalPaid(progress.totalPaid)
                    .salesReference(order.getSalesReference())
                    .paymentPercentage(order.getPaymentProgress())
                    .paidAt(order.getPaidAt())
                    .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                    .customerType(order.getCustomerType() != null ? order.getCustomerType().name() : null)
                    .deliveryStatus(order.getStatus() != null ? order.getStatus().name() : null)
                    .build();
        });
    }

    public PaymentDetailDto getPaymentDetails(Long orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        PaymentProgress progress = resolvePaymentProgress(order);
        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal scheduleTotal = repaymentScheduleTotal(order.getLoanDetails(), order);
        BigDecimal outstandingBalance = scheduleTotal.subtract(progress.totalPaid).max(BigDecimal.ZERO);

        return PaymentDetailDto.builder()
                .orderId(order.getId())
                .referenceNo(order.getReferenceNo())
                .customerName(order.getCustomerName())
                .totalAmount(totalAmount)
                .totalPaid(progress.totalPaid)
                .paymentPercentage(progress.paymentPercentage)
                .outstandingBalance(outstandingBalance)
                .totalRecords(progress.totalRecords)
                .paidRecords(progress.paidRecords)
                .pendingRecords(progress.pendingRecords)
                .overdueRecords(progress.overdueRecords)
                .payments(progress.entries)
                .build();
    }

    @Transactional
    public LoanDetails generateRepaymentSchedule(Long orderId) {
        LoanDetails loan = loanDetailsRepository.findBySalesOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Loan details not found for order"));

        // If schedule already generated, return existing
        if (loan.getRepaymentEntries() != null && !loan.getRepaymentEntries().isEmpty()) {
            return loan;
        }

        int durationMonths = parseDurationToMonths(loan.getDuration());
        int numberOfPayments = calculateNumberOfPayments(loan.getRepaymentMethod(), durationMonths);

        BigDecimal totalRepayment = loan.getTotalRepayment();
        if (totalRepayment == null) {
            BigDecimal interest = loan.getInterestOnLoan() != null ? loan.getInterestOnLoan() : BigDecimal.ZERO;
            totalRepayment = loan.getProductAmount().add(interest);
            loan.setTotalRepayment(totalRepayment);
        }

        BigDecimal totalInterest = loan.getInterestOnLoan() != null ? loan.getInterestOnLoan() : BigDecimal.ZERO;
        BigDecimal perPeriodPayment = totalRepayment.divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);
        BigDecimal perPeriodPrincipal = loan.getProductAmount().divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);
        BigDecimal perPeriodInterest = totalInterest.divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);

        List<LoanRepaymentEntry> entries = new ArrayList<>();
        LocalDate currentDueDate = loan.getStartDate() != null ? loan.getStartDate() : LocalDate.now();
        BigDecimal outstandingBalance = totalRepayment;

        for (int i = 1; i <= numberOfPayments; i++) {
            currentDueDate = calculateNextDueDate(currentDueDate, loan.getRepaymentMethod());
            outstandingBalance = outstandingBalance.subtract(perPeriodPayment);

            LoanRepaymentEntry entry = new LoanRepaymentEntry();
            entry.setLoanDetails(loan);
            entry.setEntryNumber(i);
            entry.setAmountDue(perPeriodPayment);
            entry.setPrincipalPortion(perPeriodPrincipal);
            entry.setInterestPortion(perPeriodInterest);
            entry.setOutstandingBalance(outstandingBalance.max(BigDecimal.ZERO));
            entry.setDueDate(currentDueDate);
            entry.setStatus("PENDING");
            entries.add(entry);
        }

        loan.setRepaymentEntries(entries);
        LoanDetails saved = loanDetailsRepository.save(loan);
        syncInstallmentPlanSchedule(orderId, entries, numberOfPayments, perPeriodPayment, totalRepayment);
        return saved;
    }

    // Phase 2 of the order/SalesOrder unification: mirrors the just-generated
    // LoanRepaymentEntry schedule onto the shadow InstallmentPlan/Installment rows (see
    // InstallmentPlan.salesOrderId), copying the already-computed amounts/due dates
    // instead of recalculating them, so the two schedules can't drift apart from
    // each other.
    private void syncInstallmentPlanSchedule(Long salesOrderId, List<LoanRepaymentEntry> entries,
                                              int numberOfPayments, BigDecimal perPeriodPayment,
                                              BigDecimal totalRepayment) {
        installmentPlanRepository.findBySalesOrderId(salesOrderId).ifPresent(plan -> {
            plan.setNumberOfInstallments(numberOfPayments);
            plan.setInstallmentAmount(perPeriodPayment.doubleValue());
            // Keep grandTotal in sync with the real schedule total - see ORDERING #5.
            // createInstallmentPlanShadow can only guess at this before a schedule exists
            // (and used to fall back to 0 when interest was null), which would otherwise
            // permanently pin resolveInstallmentPlanProgress's paid percentage at 0%.
            if (totalRepayment != null && totalRepayment.compareTo(BigDecimal.ZERO) > 0) {
                plan.setGrandTotal(totalRepayment.doubleValue());
                plan.setRemainingBalance(totalRepayment.doubleValue());
            }
            installmentPlanRepository.save(plan);

            for (LoanRepaymentEntry entry : entries) {
                Installment installment = new Installment();
                installment.setInstallmentPlan(plan);
                installment.setInstallmentNumber(entry.getEntryNumber());
                installment.setAmountDue(entry.getAmountDue().doubleValue());
                installment.setDueDate(entry.getDueDate());
                installment.setStatus(InstallmentStatus.PENDING);
                installmentRepository.save(installment);
            }
        });
    }

    // ==================== PHASE 3 BACKFILL (one-off, admin-triggered) ====================

    // Phase 3 of the order/SalesOrder unification: creates the OrderItem/InstallmentPlan
    // shadow rows for every walk-in/online SalesOrder that predates the Phase 2 dual-write
    // added this session - those rows have no shadow since OrderItem.salesOrderId/
    // InstallmentPlan.salesOrderId didn't exist yet when they were created. Idempotent:
    // only fills in a shadow where one is missing, safe to call more than once.
    // Historical orders whose productId was never captured (every order created before
    // the SalesOrder.productId fix in createBaseSalesOrder above) are skipped for the
    // OrderItem backfill rather than given a fabricated id - counted separately in the
    // result so nothing here is silently wrong.
    @Transactional
    public Map<String, Object> backfillOrderItemAndInstallmentPlanShadows() {
        int orderItemsCreated = 0;
        int orderItemsSkippedNoProductId = 0;
        int installmentPlansCreated = 0;
        int installmentsCreated = 0;

        List<SalesOrder> nonMobileOrders = salesOrderRepository.findAll().stream()
                .filter(o -> o.getChannel() != SalesChannel.MOBILE)
                .collect(java.util.stream.Collectors.toList());

        for (SalesOrder order : nonMobileOrders) {
            if (!orderItemRepository.findBySalesOrderId(order.getId()).isEmpty()) {
                continue;
            }
            if (order.getProductId() == null) {
                orderItemsSkippedNoProductId++;
                continue;
            }
            createOrderItemForSalesOrder(order);
            orderItemsCreated++;
        }

        for (SalesOrder order : nonMobileOrders) {
            if (installmentPlanRepository.findBySalesOrderId(order.getId()).isPresent()) {
                continue;
            }
            LoanDetails loan = loanDetailsRepository.findBySalesOrderId(order.getId()).orElse(null);
            if (loan == null) {
                continue;
            }
            createInstallmentPlanShadow(order, loan);
            installmentPlansCreated++;

            List<LoanRepaymentEntry> existingEntries = loanRepaymentEntryRepository
                    .findByLoanDetailsIdOrderByEntryNumberAsc(loan.getId());
            if (!existingEntries.isEmpty()) {
                installmentsCreated += backfillInstallmentsFromEntries(order.getId(), existingEntries);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("orderItemsCreated", orderItemsCreated);
        result.put("orderItemsSkippedNoProductId", orderItemsSkippedNoProductId);
        result.put("installmentPlansCreated", installmentPlansCreated);
        result.put("installmentsCreated", installmentsCreated);
        return result;
    }

    // Backfill variant of syncInstallmentPlanSchedule: preserves each existing
    // LoanRepaymentEntry's actual status/amountPaid/paidDate (which may already include
    // real payment history), instead of always creating fresh PENDING rows the way the
    // live schedule-generation path does for a brand new schedule.
    private int backfillInstallmentsFromEntries(Long salesOrderId, List<LoanRepaymentEntry> entries) {
        Optional<InstallmentPlan> planOpt = installmentPlanRepository.findBySalesOrderId(salesOrderId);
        if (planOpt.isEmpty()) {
            return 0;
        }
        InstallmentPlan plan = planOpt.get();
        int completed = 0;
        for (LoanRepaymentEntry entry : entries) {
            Installment installment = new Installment();
            installment.setInstallmentPlan(plan);
            installment.setInstallmentNumber(entry.getEntryNumber());
            installment.setAmountDue(entry.getAmountDue() != null ? entry.getAmountDue().doubleValue() : 0.0);
            installment.setDueDate(entry.getDueDate());
            boolean paid = "PAID".equals(entry.getStatus());
            installment.setStatus(paid ? InstallmentStatus.PAID
                    : "OVERDUE".equals(entry.getStatus()) ? InstallmentStatus.OVERDUE : InstallmentStatus.PENDING);
            installment.setAmountPaid(entry.getAmountPaid() != null ? entry.getAmountPaid().doubleValue() : 0.0);
            installment.setPaidDate(entry.getPaidDate());
            installmentRepository.save(installment);
            if (paid) {
                completed++;
            }
        }
        plan.setNumberOfInstallments(entries.size());
        BigDecimal perPeriod = entries.get(0).getAmountDue();
        plan.setInstallmentAmount(perPeriod != null ? perPeriod.doubleValue() : 0.0);
        plan.setCompletedInstallments(completed);
        if (completed == entries.size() && completed > 0) {
            plan.setStatus(InstallmentStatus.COMPLETED);
            plan.setCompletionDate(LocalDate.now());
        }
        installmentPlanRepository.save(plan);
        return entries.size();
    }

    public List<Map<String, String>> getCreditPaymentOptions() {
        List<Map<String, String>> options = new ArrayList<>();
        options.add(Map.of(
                "value", "50_NOW_BALANCE_ON_DELIVERY",
                "label", "50% now and spread remaining payment upon product delivery"));
        options.add(Map.of(
                "value", "50_INSTALLMENTS_BALANCE_ON_DELIVERY",
                "label", "Pay 50% in monthly installments, with the remaining 50% due upon product delivery"));
        options.add(Map.of(
                "value", "COLLECT_ON_100_PAYMENT",
                "label", "Pay and collect product upon 100% payment"));
        return options;
    }

    public Map<String, Object> calculateLoanSchedule(LoanScheduleCalculationDto dto) {
        int durationMonths = parseDurationToMonths(dto.getDuration());
        int numberOfPayments = calculateNumberOfPayments(dto.getRepaymentMethod(), durationMonths);

        // Simple interest calculation
        BigDecimal interestOnLoan = dto.getProductAmount()
                .multiply(dto.getRate().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                .multiply(BigDecimal.valueOf(durationMonths).divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalRepayment = dto.getProductAmount().add(interestOnLoan);
        BigDecimal perPeriodPayment = totalRepayment.divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);
        BigDecimal perPeriodPrincipal = dto.getProductAmount().divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);
        BigDecimal perPeriodInterest = interestOnLoan.divide(BigDecimal.valueOf(numberOfPayments), 2, RoundingMode.HALF_UP);

        LocalDate startDate = LocalDate.parse(dto.getStartDate());
        LocalDate currentDueDate = startDate;
        BigDecimal outstandingBalance = totalRepayment;

        List<LoanScheduleEntryDto> entries = new ArrayList<>();
        for (int i = 1; i <= numberOfPayments; i++) {
            currentDueDate = calculateNextDueDate(currentDueDate, dto.getRepaymentMethod());
            outstandingBalance = outstandingBalance.subtract(perPeriodPayment);

            entries.add(new LoanScheduleEntryDto(
                    i, perPeriodPayment, perPeriodPrincipal, perPeriodInterest,
                    outstandingBalance.max(BigDecimal.ZERO), currentDueDate
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("productAmount", dto.getProductAmount());
        result.put("interestRate", dto.getRate());
        result.put("interestOnLoan", interestOnLoan);
        result.put("totalRepayment", totalRepayment);
        result.put("numberOfPayments", numberOfPayments);
        result.put("perPeriodPayment", perPeriodPayment);
        result.put("repaymentMethod", dto.getRepaymentMethod());
        result.put("duration", dto.getDuration());
        result.put("schedule", entries);
        return result;
    }

    // ==================== LOAN HELPER METHODS ====================

    private int parseDurationToMonths(String duration) {
        String num = duration.replaceAll("[^0-9]", "");
        return Integer.parseInt(num);
    }

    private int calculateNumberOfPayments(String repaymentMethod, int durationMonths) {
        return switch (repaymentMethod.toUpperCase()) {
            case "WEEKLY" -> durationMonths * 4;
            case "BI-WEEKLY" -> durationMonths * 2;
            default -> durationMonths; // MONTHLY
        };
    }

    private LocalDate calculateNextDueDate(LocalDate current, String repaymentMethod) {
        return switch (repaymentMethod.toUpperCase()) {
            case "WEEKLY" -> current.plusWeeks(1);
            case "BI-WEEKLY" -> current.plusWeeks(2);
            default -> current.plusMonths(1); // MONTHLY
        };
    }

    // ==================== NOTIFICATIONS ====================

    private void createNotification(SalesOrder order, NotificationType type, String message) {
        SalesNotification notification = new SalesNotification();
        notification.setSalesOrderId(order.getId());
        notification.setCustomerName(order.getCustomerName());
        notification.setNotificationType(type);
        notification.setMessage(message);
        salesNotificationRepository.save(notification);
    }

    public List<SalesNotification> getOrderlistNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.ORDERLIST);
    }

    public List<SalesNotification> getCancelledNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.CANCELLED);
    }

    public List<SalesNotification> getRefundNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.REFUND);
    }

    // ==================== NOTIFICATION SEEN COUNTS (per user) ====================

    public Map<String, Object> getNotificationSeenCounts(Long userId) {
        OrderNotificationSeen seen = orderNotificationSeenRepository.findByUserId(userId)
                .orElse(null);
        Map<String, Object> result = new HashMap<>();
        result.put("orderList", seen != null ? seen.getOrderList() : 0);
        result.put("cancelled", seen != null ? seen.getCancelled() : 0);
        result.put("refund", seen != null ? seen.getRefund() : 0);
        return result;
    }

    @Transactional
    public Map<String, Object> saveNotificationSeenCounts(Long userId, NotificationSeenDto dto) {
        try {
            OrderNotificationSeen seen = orderNotificationSeenRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        OrderNotificationSeen created = new OrderNotificationSeen();
                        created.setUserId(userId);
                        return created;
                    });
            if (dto.getOrderList() != null) seen.setOrderList(dto.getOrderList());
            if (dto.getCancelled() != null) seen.setCancelled(dto.getCancelled());
            if (dto.getRefund() != null) seen.setRefund(dto.getRefund());
            orderNotificationSeenRepository.save(seen);
        } catch (DataIntegrityViolationException e) {
            OrderNotificationSeen seen = orderNotificationSeenRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Failed to resolve notification record after concurrent insert"));
            if (dto.getOrderList() != null) seen.setOrderList(dto.getOrderList());
            if (dto.getCancelled() != null) seen.setCancelled(dto.getCancelled());
            if (dto.getRefund() != null) seen.setRefund(dto.getRefund());
            orderNotificationSeenRepository.save(seen);
        }
        return getNotificationSeenCounts(userId);
    }

    // ==================== BRANCH ====================

    // All sales tagged to a branch, optionally within a date range (Branch module).
    public List<SalesOrder> getBranchSales(Long branchId, LocalDateTime startDate, LocalDateTime endDate) {
        // The branch id arrives straight off the URL, so it has to be validated:
        // a branch user may only ask for their own branch.
        Long scopedBranchId = branchScopeService.resolveReadBranchId(branchId);
        if (startDate != null && endDate != null) {
            return salesOrderRepository
                    .findByBranchIdAndCreatedAtBetweenOrderByCreatedAtDesc(scopedBranchId, startDate, endDate);
        }
        return salesOrderRepository.findByBranchIdOrderByCreatedAtDesc(scopedBranchId);
    }

    // Plain, unfiltered page of every SalesOrder - backs the cashier's "cash payment"
    // reference-number picker (frontend/src/lib/cashierApi.js getSalesOrderReferences),
    // which has been calling GET /sales/orders since before this endpoint existed.
    public Page<SalesOrder> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findAll(pageable);
    }

    // ==================== REPORTS ====================

    public Page<SalesOrder> getSalesReport(LocalDateTime startDate, LocalDateTime endDate,
            String orderMethod, String displayOption, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Branch users only see sales for their own branch.
        Long branchId = branchScopeService.getScopedBranchId();
        if (branchId != null) {
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByBranchIdAndCreatedAtBetween(branchId, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByBranchId(branchId, pageable);
        }

        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        }
        return salesOrderRepository.findAll(pageable);
    }

    public Page<SalesOrder> getOrdersReport(LocalDateTime startDate, LocalDateTime endDate,
            String orderMethod, String displayOption, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Branch users only see sales for their own branch.
        Long branchId = branchScopeService.getScopedBranchId();

        if (orderMethod != null && !orderMethod.isEmpty()) {
            SalesOrderType type = SalesOrderType.valueOf(orderMethod);
            if (branchId != null) {
                if (startDate != null && endDate != null) {
                    return salesOrderRepository.findByBranchIdAndOrderTypeAndCreatedAtBetween(
                            branchId, type, startDate, endDate, pageable);
                }
                return salesOrderRepository.findByBranchIdAndOrderType(branchId, type, pageable);
            }
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByOrderTypeAndCreatedAtBetween(type, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByOrderType(type, pageable);
        }

        if (branchId != null) {
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByBranchIdAndCreatedAtBetween(branchId, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByBranchId(branchId, pageable);
        }

        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        }
        return salesOrderRepository.findAll(pageable);
    }

    public Page<SalesOrder> getOrdersActionReport(String action, LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        OrderStatus status = switch (action.toUpperCase()) {
            case "REFUND_ORDER" -> OrderStatus.REFUNDED;
            case "CANCELLED_ORDER" -> OrderStatus.CANCELLED;
            case "PROGRESS" -> OrderStatus.PROCESSING;
            default -> OrderStatus.PENDING;
        };

        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? salesOrderRepository.findByStatus(status, pageable)
                : salesOrderRepository.findByStatusAndBranchId(status, branchId, pageable);
    }

    public Page<SalesOrder> getOnlineInstallmentReport(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            return salesOrderRepository.findOnlineInstallmentOrdersByBranch(startDate, endDate, branchId, pageable);
        }
        return salesOrderRepository.findOnlineInstallmentOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getOnlineOneOffReport(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            return salesOrderRepository.findOnlineOneOffOrdersByBranch(startDate, endDate, branchId, pageable);
        }
        return salesOrderRepository.findOnlineOneOffOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getAllOnlineSales(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByCustomerTypeAndBranchIdAndCreatedAtBetween(
                        CustomerType.ONLINE, branchId, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByCustomerTypeAndBranchId(CustomerType.ONLINE, branchId, pageable);
        }
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCustomerTypeAndCreatedAtBetween(
                    CustomerType.ONLINE, startDate, endDate, pageable);
        }
        return salesOrderRepository.findByCustomerType(CustomerType.ONLINE, pageable);
    }

    public Page<SalesOrder> getAllWalkInSales(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByCustomerTypeAndBranchIdAndCreatedAtBetween(
                        CustomerType.WALKIN, branchId, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByCustomerTypeAndBranchId(CustomerType.WALKIN, branchId, pageable);
        }
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCustomerTypeAndCreatedAtBetween(
                    CustomerType.WALKIN, startDate, endDate, pageable);
        }
        return salesOrderRepository.findByCustomerType(CustomerType.WALKIN, pageable);
    }

    public Page<SalesOrder> getWalkInCreditReport(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            return salesOrderRepository.findWalkInCreditOrdersByBranch(startDate, endDate, branchId, pageable);
        }
        return salesOrderRepository.findWalkInCreditOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getWalkInCashReport(LocalDateTime startDate,
            LocalDateTime endDate, Long branchId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (branchId != null) {
            return salesOrderRepository.findWalkInCashOrdersByBranch(startDate, endDate, branchId, pageable);
        }
        return salesOrderRepository.findWalkInCashOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getRefundReturnReport(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("refundedAt").descending());
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByIsRefundedTrueAndRefundedAtBetween(startDate, endDate, pageable);
        }
        return salesOrderRepository.findByIsRefundedTrue(pageable);
    }

    public Page<SalesOrder> getCancelledOrdersReport(LocalDateTime startDate, LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("cancelledAt").descending());
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByStatusAndCancelledAtBetween(OrderStatus.CANCELLED, startDate, endDate, pageable);
        }
        return salesOrderRepository.findByStatus(OrderStatus.CANCELLED, pageable);
    }
}

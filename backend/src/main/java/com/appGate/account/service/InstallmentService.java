package com.appGate.account.service;

import com.appGate.account.dto.InstallmentPlanDto;
import com.appGate.account.dto.InstallmentPlanResponseDto;
import com.appGate.account.dto.InstallmentResponseDto;
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
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InstallmentService {

    private final InstallmentPlanRepository installmentPlanRepository;
    private final InstallmentRepository installmentRepository;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final com.appGate.orderingsales.service.MobileSalesOrderSyncService mobileSalesOrderSyncService;
    private final com.appGate.orderingsales.service.DeliveryFeeQuoteService deliveryFeeQuoteService;

    // Insurance rate (10%)
    private static final Double INSURANCE_RATE = 0.10;

    /**
     * Preview a plan for the caller's current cart without saving anything.
     * No order needs to exist yet - the amount financed is the cart's product
     * subtotal only (no delivery fee - that's billed separately and always
     * paid in full), priced server-side, never taken from the request.
     * <p>
     * Pass the optional delivery destination (see InstallmentPlanDto) to have the
     * delivery fee priced into the preview as well. It is reported as its own
     * {@code deliveryFee} and folded into {@code firstPaymentAmount} only - never spread
     * across the installments, which stay {@code installmentAmount} each. Render those
     * fields rather than dividing a delivery-inclusive total by the number of periods.
     */
    public BaseResponse calculateInstallmentPlan(InstallmentPlanDto dto) {
        try {
            com.appGate.orderingsales.response.BaseResponse quoteResponse = quoteCartSubtotal(dto);
            if (quoteResponse.getStatus() != HttpStatus.OK.value()) {
                return BaseResponse.builder()
                        .status(quoteResponse.getStatus())
                        .message(quoteResponse.getMessage())
                        .build();
            }
            java.math.BigDecimal subtotal = (java.math.BigDecimal) quoteResponse.getResponse();

            InstallmentPlan plan = buildPlan(dto, subtotal.doubleValue());

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Installment plan preview calculated successfully")
                    .data(InstallmentPlanResponseDto.from(plan))
                    .build();
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // e.g. DELIVERY fulfillment with no address/state/LGA to price it with - a
            // client error, not a server one (see DeliveryFeeQuoteService.quoteDeliveryFee).
            return BaseResponse.builder()
                    .status(e.getStatusCode().value())
                    .message(e.getReason())
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to calculate installment plan: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Persist the plan the customer previewed and decided to proceed with. Still
     * has no orderId - it's saved before the order exists, and OrderService.checkout()
     * links it onto the order once that's created, using the returned plan's id
     * as CheckoutDto.installmentPlanId.
     *
     * Send the same delivery destination here as on the preview: the quoted delivery fee
     * is stored on the plan (never financed into it) and is what the down-payment charge
     * then collects in full - see PaymentGatewayService.resolveDownPaymentDeliveryFee.
     *
     * Idempotent: the mobile app has no way to resume a plan it already created (e.g.
     * after a network retry, or backing out and re-entering the installment checkout
     * screen), so without this every re-submission of an unchanged cart/duration would
     * create a brand new, functionally identical InstallmentPlan row. That's exactly
     * what defeats PaymentGatewayService.resolveOrphanedDownPaymentPlan's userId+amount
     * matching once the down payment is paid (several open plans with the same amount
     * to choose between) - reuse the existing plan instead of creating a duplicate
     * whenever one already matches this user/frequency/duration/grandTotal.
     */
    @Transactional
    public BaseResponse createInstallmentPlan(InstallmentPlanDto dto) {
        try {
            com.appGate.orderingsales.response.BaseResponse quoteResponse = quoteCartSubtotal(dto);
            if (quoteResponse.getStatus() != HttpStatus.OK.value()) {
                return BaseResponse.builder()
                        .status(quoteResponse.getStatus())
                        .message(quoteResponse.getMessage())
                        .build();
            }
            java.math.BigDecimal subtotal = (java.math.BigDecimal) quoteResponse.getResponse();

            InstallmentPlan plan = buildPlan(dto, subtotal.doubleValue());

            Optional<InstallmentPlan> existing = installmentPlanRepository.findByUserId(dto.getUserId()).stream()
                    .filter(p -> p.getOrderId() == null)
                    .filter(p -> !Boolean.TRUE.equals(p.getDownPaymentPaid()))
                    .filter(p -> p.getFrequency() == plan.getFrequency())
                    .filter(p -> p.getNumberOfInstallments() != null
                            && p.getNumberOfInstallments().equals(plan.getNumberOfInstallments()))
                    .filter(p -> p.getGrandTotal() != null
                            && Math.abs(p.getGrandTotal() - plan.getGrandTotal()) < 0.01)
                    // Same cart/duration but a different delivery destination is NOT the
                    // same plan: reusing one would leave the customer paying the delivery
                    // fee quoted for the address they just changed away from.
                    .filter(p -> Math.abs(deliveryFeeOf(p) - deliveryFeeOf(plan)) < 0.01)
                    .max(Comparator.comparing(InstallmentPlan::getId));

            InstallmentPlan savedPlan = existing.orElseGet(() -> installmentPlanRepository.save(plan));

            return BaseResponse.builder()
                    .status(existing.isPresent() ? HttpStatus.OK.value() : HttpStatus.CREATED.value())
                    .message(existing.isPresent()
                            ? "Installment plan already exists for this cart/duration"
                            : "Installment plan created successfully")
                    .data(InstallmentPlanResponseDto.from(savedPlan))
                    .build();
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // See the matching catch in calculateInstallmentPlan.
            return BaseResponse.builder()
                    .status(e.getStatusCode().value())
                    .message(e.getReason())
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to create installment plan: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Sums the caller's current cart at real product prices - no delivery fee.
     * Delivery is billed separately and always paid in full up front, so the
     * amount an installment plan finances never includes it; the amount is
     * also never taken from the request payload.
     */
    private com.appGate.orderingsales.response.BaseResponse quoteCartSubtotal(InstallmentPlanDto dto) {
        return orderService.calculateCartSubtotal(dto.getUserId());
    }

    /** A plan's quoted delivery fee, treating the legacy null (pre-V1000.9 rows) as 0. */
    private static double deliveryFeeOf(InstallmentPlan plan) {
        return plan.getDeliveryFee() != null ? plan.getDeliveryFee() : 0.0;
    }

    // The down payment is no longer a flat percentage of grandTotal - it automatically
    // equals one period's payment, IS installment #1 of the schedule (not a charge on
    // top of it), and settles that period outright (e.g. order=15,000 over a selected
    // duration of 3 monthly periods of 5,000 each -> down payment=installment #1=5,000,
    // leaving installments #2-3 of 5,000 each still to collect). plan.installments
    // therefore still has all totalPeriods rows - see applyDownPaymentCollected, which
    // marks row #1 PAID once the down payment is collected, and
    // MobileSalesOrderSyncService.createLoanShadow, which mirrors this schedule as-is
    // without a separate synthetic down-payment entry.
    //
    // The delivery fee is quoted here too (when dto carries a delivery destination) but is
    // deliberately kept OUT of amountFinanced/grandTotal/periodAmount, so it is never
    // divided across the periods: it rides entirely on the first payment. The financed
    // schedule stays delivery-free; plan.deliveryFee carries the fee and
    // InstallmentPlanResponseDto.firstPaymentAmount is what the customer actually pays up
    // front (downPayment + deliveryFee).
    private InstallmentPlan buildPlan(InstallmentPlanDto dto, Double amountFinanced) {
        Double insuranceAmount = amountFinanced * INSURANCE_RATE;
        Double grandTotal = amountFinanced + insuranceAmount;

        Integer totalPeriods = calculateNumberOfInstallments(
            dto.getFrequency(),
            dto.getDurationInMonths()
        );
        Double periodAmount = grandTotal / totalPeriods;

        // Server-priced from the cart and the supplied destination, never taken from the
        // request - ZERO when no destination was supplied, or for PICKUP.
        Double deliveryFee = deliveryFeeQuoteService.quoteDeliveryFee(
                dto.getUserId(), dto.getFulfillmentType(), dto.getDeliveryAddress(),
                dto.getDeliveryStateId(), dto.getDeliveryLgaId(), dto.getDeliveryCountry())
                .doubleValue();

        InstallmentPlan plan = new InstallmentPlan();
        plan.setUserId(dto.getUserId());
        plan.setTotalAmount(amountFinanced);
        plan.setInsuranceAmount(insuranceAmount);
        plan.setGrandTotal(grandTotal);
        plan.setDeliveryFee(deliveryFee);
        plan.setFrequency(dto.getFrequency());
        plan.setStatus(InstallmentStatus.ACTIVE);
        plan.setStartDate(LocalDate.now());
        plan.setEarlyShipmentEligible(false);

        List<Installment> fullSchedule = generateInstallmentSchedule(
            plan,
            totalPeriods,
            periodAmount,
            dto.getFrequency()
        );

        Double downPayment = fullSchedule.get(0).getAmountDue();
        plan.setDownPayment(downPayment);
        plan.setRemainingBalance(grandTotal - downPayment);
        plan.setInstallmentAmount(periodAmount);
        plan.setNumberOfInstallments(totalPeriods);
        plan.setNextPaymentDate(fullSchedule.get(0).getDueDate());
        plan.setInstallments(fullSchedule);
        return plan;
    }

    // Total periods for the selected duration, e.g. 6 months of MONTHLY -> 6. This is
    // the full schedule length BEFORE buildPlan peels off period #1 as the down
    // payment, not the number of installments actually left to collect afterward.
    private Integer calculateNumberOfInstallments(InstallmentFrequency frequency, Integer months) {
        return switch (frequency) {
            case DAILY -> months * 30; // Approximate
            case WEEKLY -> months * 4;
            case MONTHLY -> months;
        };
    }

    private LocalDate calculateNextPaymentDate(LocalDate currentDate, InstallmentFrequency frequency) {
        return switch (frequency) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> currentDate.plusMonths(1);
        };
    }

    private List<Installment> generateInstallmentSchedule(
            InstallmentPlan plan,
            Integer numberOfInstallments,
            Double installmentAmount,
            InstallmentFrequency frequency) {

        List<Installment> installments = new ArrayList<>();
        LocalDate currentDueDate = plan.getStartDate();

        for (int i = 1; i <= numberOfInstallments; i++) {
            currentDueDate = calculateNextPaymentDate(currentDueDate, frequency);

            Installment installment = new Installment();
            installment.setInstallmentPlan(plan);
            installment.setInstallmentNumber(i);
            installment.setAmountDue(installmentAmount);
            installment.setDueDate(currentDueDate);
            installment.setStatus(InstallmentStatus.PENDING);
            installment.setAmountPaid(0.0);
            installment.setDaysOverdue(0);

            installments.add(installment);
        }

        return installments;
    }

    public BaseResponse getInstallmentPlan(Long planId) {
        return installmentPlanRepository.findById(planId)
                .map(plan -> BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Installment plan retrieved successfully")
                        .data(InstallmentPlanResponseDto.from(plan))
                        .build())
                .orElse(BaseResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Installment plan not found")
                        .build());
    }

    public BaseResponse getUserInstallmentPlans(Long userId) {
        List<InstallmentPlan> plans = installmentPlanRepository.findByUserId(userId);

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User installment plans retrieved successfully")
                .data(plans.stream().map(InstallmentPlanResponseDto::from).collect(java.util.stream.Collectors.toList()))
                .build();
    }

    public BaseResponse getInstallmentSchedule(Long planId) {
        List<Installment> installments = installmentRepository.findByInstallmentPlanId(planId);

        // Create detailed breakdown
        Map<String, Object> response = new HashMap<>();
        response.put("installments", installments.stream().map(InstallmentResponseDto::from).collect(java.util.stream.Collectors.toList()));
        response.put("totalInstallments", installments.size());
        response.put("paidInstallments", installments.stream()
            .filter(i -> i.getStatus() == InstallmentStatus.PAID)
            .count());
        response.put("pendingInstallments", installments.stream()
            .filter(i -> i.getStatus() == InstallmentStatus.PENDING)
            .count());

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Installment schedule retrieved successfully")
                .data(response)
                .build();
    }

    public BaseResponse getUpcomingPayments(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate nextMonth = today.plusMonths(1);

        List<Installment> upcomingInstallments = installmentRepository
            .findUpcomingPayments(userId, today, nextMonth);

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Upcoming payments retrieved successfully")
                .data(upcomingInstallments.stream().map(InstallmentResponseDto::from).collect(java.util.stream.Collectors.toList()))
                .build();
    }

    /**
     * Pay a specific installment by its own row ID. Callers must have obtained this ID
     * from the plan's schedule (GET /installments/{planId}/schedule) - it is NOT the
     * installment plan's ID. Passing a plan ID here will pay whatever unrelated
     * installment happens to share that primary key.
     */
    @Transactional
    public BaseResponse payInstallment(Long installmentId, Long userId) {
        try {
            Installment installment = installmentRepository.findById(installmentId)
                    .orElseThrow(() -> new RuntimeException("Installment not found"));

            if (!installment.getInstallmentPlan().getUserId().equals(userId)) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This installment does not belong to the requesting user")
                        .build();
            }

            return payInstallmentInternal(installment, userId);
        } catch (RuntimeException e) {
            // mobileSalesOrderSyncService.syncInstallmentPaid (called from
            // payInstallmentInternal) may have already marked this shared transaction
            // rollback-only before throwing. Swallowing that here and returning a normal
            // response would make Spring's commit-time check find rollback-only set and
            // throw UnexpectedRollbackException instead - masking the real cause and
            // skipping this method's own error response. Rethrow in that case so Spring
            // rolls back cleanly and the actual error reaches the client.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process installment payment: " + e.getMessage())
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process installment payment: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Pay whichever installment is next due on a plan, resolved server-side by plan ID.
     * This is the safe entry point for clients that only have the plan ID back from
     * /installments/calculate - it sidesteps the plan-ID vs installment-ID mixup entirely.
     */
    @Transactional
    public BaseResponse payNextInstallmentByWallet(Long planId, Long userId) {
        try {
            InstallmentPlan plan = installmentPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Installment plan not found"));

            if (!plan.getUserId().equals(userId)) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This installment plan does not belong to the requesting user")
                        .build();
            }

            Installment nextInstallment = installmentRepository
                    .findByInstallmentPlanIdAndStatus(planId, InstallmentStatus.PENDING)
                    .stream()
                    .min(Comparator.comparing(Installment::getInstallmentNumber))
                    .orElse(null);

            if (nextInstallment == null) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("No pending installments remain for this plan")
                        .build();
            }

            return payInstallmentInternal(nextInstallment, userId);
        } catch (RuntimeException e) {
            // See the matching catch in payInstallment for why this check is needed.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process installment payment: " + e.getMessage())
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process installment payment: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Pay off every still-PENDING installment on a plan in one wallet debit, settling the
     * plan in full immediately rather than advancing it one installment at a time. Debits
     * the sum of the remaining installments' amountDue as a single transaction, then marks
     * all of them PAID against that one payment record.
     */
    @Transactional
    public BaseResponse payFullInstallmentPlanByWallet(Long planId, Long userId) {
        try {
            InstallmentPlan plan = installmentPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Installment plan not found"));

            if (!plan.getUserId().equals(userId)) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This installment plan does not belong to the requesting user")
                        .build();
            }

            List<Installment> pending = installmentRepository
                    .findByInstallmentPlanIdAndStatus(planId, InstallmentStatus.PENDING)
                    .stream()
                    .sorted(Comparator.comparing(Installment::getInstallmentNumber))
                    .collect(java.util.stream.Collectors.toList());

            if (pending.isEmpty()) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("This installment plan has already been fully paid")
                        .build();
            }

            double totalDue = pending.stream().mapToDouble(Installment::getAmountDue).sum();

            // Deduct from wallet - the sum of every remaining installment, in one go
            BaseResponse debitResponse = walletService.debitWallet(
                    userId,
                    totalDue,
                    "Full settlement of installment plan " + planId);

            if (debitResponse.getStatus() != HttpStatus.OK.value()) {
                return debitResponse; // Return wallet error if insufficient balance
            }

            // Create a single payment record covering the whole settlement
            Payment payment = new Payment();
            payment.setOrderId(plan.getOrderId());
            payment.setUserId(userId);
            payment.setAmount(totalDue);
            payment.setPaymentMethod(PaymentMethod.WALLET);
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaymentReference("INST-FULL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            payment.setPaidAt(LocalDateTime.now());
            payment.setIsInstallmentPayment(true);
            paymentRepository.save(payment);

            // Mark every remaining installment paid against that same payment
            LocalDate today = LocalDate.now();
            for (Installment installment : pending) {
                installment.setStatus(InstallmentStatus.PAID);
                installment.setPaidDate(today);
                installment.setAmountPaid(installment.getAmountDue());
                installment.setPaymentId(payment.getId());
            }
            installmentRepository.saveAll(pending);

            // Update installment plan - this settles it, so it's always complete
            plan.setCompletedInstallments(plan.getNumberOfInstallments());
            if (plan.getCompletedInstallments() >= 2) {
                plan.setEarlyShipmentEligible(true);
            }
            plan.setStatus(InstallmentStatus.COMPLETED);
            plan.setCompletionDate(today);
            installmentPlanRepository.save(plan);

            // Reflect final payoff on the linked order so it stops showing as awaiting payment.
            if (plan.getOrderId() != null) {
                orderRepository.findById(plan.getOrderId()).ifPresent(order -> {
                    order.setIsPaid(true);
                    order.setOrderStatus(com.appGate.orderingsales.enums.OrderStatus.PAYMENT_CONFIRMED);
                    orderRepository.save(order);
                });

                // Mirror each settled installment onto the admin-facing SalesOrder/LoanDetails
                // shadow one at a time, same as payInstallmentInternal - its repayment-entry
                // lookup matches by installment number, so it can't be collapsed into one call.
                for (int i = 0; i < pending.size(); i++) {
                    boolean isLast = i == pending.size() - 1;
                    mobileSalesOrderSyncService.syncInstallmentPaid(plan.getOrderId(), pending.get(i), isLast);
                }
            }

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Installment plan paid in full and wallet debited successfully")
                    .data(InstallmentPlanResponseDto.from(plan))
                    .build();
        } catch (RuntimeException e) {
            // See the matching catch in payInstallment for why this check is needed.
            if (TransactionAspectSupport.currentTransactionStatus().isRollbackOnly()) {
                throw e;
            }
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process full installment payment: " + e.getMessage())
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process full installment payment: " + e.getMessage())
                    .build();
        }
    }

    private BaseResponse payInstallmentInternal(Installment installment, Long userId) {
        if (installment.getStatus() == InstallmentStatus.PAID) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Installment already paid")
                    .build();
        }

        // Deduct from wallet - the exact installment amount
        BaseResponse debitResponse = walletService.debitWallet(
                userId,
                installment.getAmountDue(),
                "Payment for installment " + installment.getInstallmentNumber()
                    + " of plan " + installment.getInstallmentPlan().getId());

        if (debitResponse.getStatus() != HttpStatus.OK.value()) {
            return debitResponse; // Return wallet error if insufficient balance
        }

        // Create payment record for audit trail
        Payment payment = new Payment();
        payment.setOrderId(installment.getInstallmentPlan().getOrderId());
        payment.setUserId(userId);
        payment.setAmount(installment.getAmountDue());
        payment.setPaymentMethod(PaymentMethod.WALLET);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentReference("INST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setPaidAt(LocalDateTime.now());
        payment.setIsInstallmentPayment(true);
        paymentRepository.save(payment);

        // Mark installment as paid
        installment.setStatus(InstallmentStatus.PAID);
        installment.setPaidDate(LocalDate.now());
        installment.setAmountPaid(installment.getAmountDue());
        installment.setPaymentId(payment.getId());
        installmentRepository.save(installment);

        // Update installment plan
        InstallmentPlan plan = installment.getInstallmentPlan();
        plan.setCompletedInstallments(plan.getCompletedInstallments() + 1);

        // Check for early shipment eligibility (after 2nd payment)
        if (plan.getCompletedInstallments() >= 2) {
            plan.setEarlyShipmentEligible(true);
        }

        // Check if all installments are paid
        boolean planCompleted = plan.getCompletedInstallments().equals(plan.getNumberOfInstallments());
        if (planCompleted) {
            plan.setStatus(InstallmentStatus.COMPLETED);
            plan.setCompletionDate(LocalDate.now());
        }

        installmentPlanRepository.save(plan);

        // Reflect final payoff on the linked order so it stops showing as awaiting payment.
        if (planCompleted && plan.getOrderId() != null) {
            orderRepository.findById(plan.getOrderId()).ifPresent(order -> {
                order.setIsPaid(true);
                order.setOrderStatus(com.appGate.orderingsales.enums.OrderStatus.PAYMENT_CONFIRMED);
                orderRepository.save(order);
            });
        }

        // Mirror this part-payment onto the admin-facing SalesOrder model so it shows up on
        // the "Orderlist"/"Mark as Paid" screens, which never read the InstallmentPlan/
        // Installment/Payment tables directly.
        if (plan.getOrderId() != null) {
            mobileSalesOrderSyncService.syncInstallmentPaid(plan.getOrderId(), installment, planCompleted);
        }

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Installment payment recorded and wallet debited successfully")
                .data(InstallmentResponseDto.from(installment))
                .build();
    }
}

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
import java.time.temporal.ChronoUnit;
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
    private final GlPostingService glPostingService;

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
        // Insurance is optional; a null flag means an older client, which always had it.
        boolean includeInsurance = !Boolean.FALSE.equals(dto.getIncludeInsurance());
        Double insuranceAmount = includeInsurance ? amountFinanced * INSURANCE_RATE : 0.0;
        Double grandTotal = amountFinanced + insuranceAmount;

        LocalDate startDate = LocalDate.now();
        Integer totalPeriods = calculateNumberOfInstallments(
            dto.getFrequency(),
            dto.getDurationInMonths(),
            startDate
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
        plan.setStartDate(startDate);
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
    //
    // Counted against the real calendar from the start date, not a flat 30 days / 4 weeks
    // per month: that made a 3-month weekly plan 12 weeks (ending ~7 days early) and a
    // daily plan's last payment land a day or more off the chosen end date. Now the
    // final due date never runs past startDate + months.
    private Integer calculateNumberOfInstallments(InstallmentFrequency frequency, Integer months,
                                                  LocalDate startDate) {
        LocalDate endDate = startDate.plusMonths(months);
        long periods = switch (frequency) {
            case DAILY -> ChronoUnit.DAYS.between(startDate, endDate);
            case WEEKLY -> ChronoUnit.WEEKS.between(startDate, endDate);
            case MONTHLY -> months;
        };
        return (int) Math.max(1, periods);
    }

    private LocalDate dueDateForPeriod(LocalDate startDate, InstallmentFrequency frequency, int period) {
        return switch (frequency) {
            case DAILY -> startDate.plusDays(period);
            case WEEKLY -> startDate.plusWeeks(period);
            case MONTHLY -> startDate.plusMonths(period);
        };
    }

    private List<Installment> generateInstallmentSchedule(
            InstallmentPlan plan,
            Integer numberOfInstallments,
            Double installmentAmount,
            InstallmentFrequency frequency) {

        List<Installment> installments = new ArrayList<>();

        for (int i = 1; i <= numberOfInstallments; i++) {
            // Offset from the start date, not chained off the previous due date: chaining
            // plusMonths drifts once a short month clamps the day (Jan 31 -> Feb 28 -> Mar 28).
            LocalDate currentDueDate = dueDateForPeriod(plan.getStartDate(), frequency, i);

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
            // Always rethrow: by this point the wallet may already have been debited in
            // this same transaction, and returning a friendly error response instead lets
            // that debit COMMIT while the customer is told the payment failed - they then
            // pay again. Rethrowing rolls the debit back with everything else, and
            // GlobalExceptionHandler still turns it into an error response for the client.
            throw e;
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

            BaseResponse notStarted = rejectIfCheckoutNotCompleted(plan);
            if (notStarted != null) {
                return notStarted;
            }

            // OVERDUE rows are still owed, so they queue ahead of PENDING ones - taking only
            // PENDING would let a customer pay "the next installment" while skipping a
            // missed one, and eventually report a plan as settled that was not.
            Installment nextInstallment = collectableInstallments(planId).stream()
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
            // See the matching catch in payInstallment: always rethrow so a wallet debit
            // already applied in this transaction rolls back instead of committing behind
            // a "payment failed" message.
            throw e;
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

            BaseResponse notStarted = rejectIfCheckoutNotCompleted(plan);
            if (notStarted != null) {
                return notStarted;
            }

            // Everything still owed, PENDING and OVERDUE alike. Taking only PENDING while
            // then declaring the whole plan settled below wrote off missed installments
            // that were never charged.
            List<Installment> pending = collectableInstallments(planId).stream()
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
            // Link it to the plan and the branch, not just the order: without these a
            // repayment cannot be traced back to its plan, and branch-scoped payment
            // reporting simply does not see it.
            payment.setInstallmentPlanId(plan.getId());
            payment.setBranchId(orderBranchId(plan.getOrderId()));
            paymentRepository.save(payment);
            glPostingService.postWalletPurchase(orderBranchId(plan.getOrderId()), totalDue,
                    payment.getPaymentReference(), userId);

            // Mark every remaining installment paid against that same payment
            LocalDate today = LocalDate.now();
            for (Installment installment : pending) {
                installment.setStatus(InstallmentStatus.PAID);
                installment.setPaidDate(today);
                installment.setAmountPaid(installment.getAmountDue());
                installment.setPaymentId(payment.getId());
            }
            installmentRepository.saveAll(pending);

            // Update installment plan. This charged every row that was still owed, so the
            // plan is settled - but count what was actually paid rather than asserting the
            // full number: a row parked in some other state (CANCELLED, say) was never
            // charged here, and writing it off as paid would be money recorded, not
            // collected. If anything is left, the plan stays ACTIVE and says so.
            long stillOwed = installmentRepository.findByInstallmentPlanId(plan.getId()).stream()
                    .filter(row -> row.getStatus() != InstallmentStatus.PAID)
                    .count();
            plan.setCompletedInstallments((int) installmentRepository.findByInstallmentPlanId(plan.getId()).stream()
                    .filter(row -> row.getStatus() == InstallmentStatus.PAID)
                    .count());
            if (plan.getCompletedInstallments() >= 2) {
                plan.setEarlyShipmentEligible(true);
            }
            if (stillOwed == 0) {
                plan.setStatus(InstallmentStatus.COMPLETED);
                plan.setCompletionDate(today);
            }
            refreshPlanProgress(plan);
            installmentPlanRepository.save(plan);

            // Reflect final payoff on the linked order so it stops showing as awaiting payment.
            if (plan.getOrderId() != null) {
                if (stillOwed == 0) {
                    orderRepository.findById(plan.getOrderId()).ifPresent(order -> {
                        order.setIsPaid(true);
                        order.setOrderStatus(com.appGate.orderingsales.enums.OrderStatus.PAYMENT_CONFIRMED);
                        orderRepository.save(order);
                    });
                }

                // Mirror each settled installment onto the admin-facing SalesOrder/LoanDetails
                // shadow one at a time, same as payInstallmentInternal - its repayment-entry
                // lookup matches by installment number, so it can't be collapsed into one call.
                // Rows that were just paid are mirrored whether or not the plan is finished.
                for (int i = 0; i < pending.size(); i++) {
                    boolean isLast = stillOwed == 0 && i == pending.size() - 1;
                    mobileSalesOrderSyncService.syncInstallmentPaid(plan.getOrderId(), pending.get(i), isLast);
                }
            }

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message(stillOwed == 0
                            ? "Installment plan paid in full and wallet debited successfully"
                            : "Outstanding installments paid, but " + stillOwed
                                    + " installment(s) on this plan need attention before it can be closed")
                    .data(InstallmentPlanResponseDto.from(plan))
                    .build();
        } catch (RuntimeException e) {
            // See the matching catch in payInstallment: always rethrow so a wallet debit
            // already applied in this transaction rolls back instead of committing behind
            // a "payment failed" message.
            throw e;
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process full installment payment: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Recomputes what the plan still owes and when the next payment falls due.
     *
     * <p>Both fields were written once when the plan was built and never touched again, so
     * every consumer of the plan endpoints saw a balance that never moved no matter how
     * much the customer had paid.
     */
    private void refreshPlanProgress(InstallmentPlan plan) {
        List<Installment> rows = installmentRepository.findByInstallmentPlanId(plan.getId());
        double outstanding = rows.stream()
                .filter(row -> row.getStatus() != InstallmentStatus.PAID)
                .mapToDouble(row -> row.getAmountDue() != null ? row.getAmountDue() : 0.0)
                .sum();
        plan.setRemainingBalance(outstanding);
        plan.setNextPaymentDate(rows.stream()
                .filter(row -> row.getStatus() != InstallmentStatus.PAID)
                .min(Comparator.comparing(Installment::getInstallmentNumber))
                .map(Installment::getDueDate)
                .orElse(null));
    }

    /**
     * Everything still owed on a plan: PENDING plus OVERDUE. A missed installment does not
     * stop being owed because a scheduler relabelled it.
     */
    private List<Installment> collectableInstallments(Long planId) {
        List<Installment> owed = new java.util.ArrayList<>(
                installmentRepository.findByInstallmentPlanIdAndStatus(planId, InstallmentStatus.PENDING));
        owed.addAll(installmentRepository.findByInstallmentPlanIdAndStatus(planId, InstallmentStatus.OVERDUE));
        return owed;
    }

    /**
     * Repayments only make sense once checkout has created the order. A plan with no order
     * still has installment #1 PENDING - the down payment - so paying "the next installment"
     * would collect the down payment here without setting downPaymentPaid, and checkout
     * would then charge it a second time. It would also leave the Payment with no orderId,
     * invisible to every admin screen.
     */
    private BaseResponse rejectIfCheckoutNotCompleted(InstallmentPlan plan) {
        if (plan.getOrderId() == null) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("This plan has no order yet - complete checkout and its first payment before paying installments")
                    .build();
        }
        return null;
    }

    /** The branch the plan's order belongs to; null (posted as Head Office) when there is no order. */
    private Long orderBranchId(Long orderId) {
        return orderId == null ? null
                : orderRepository.findById(orderId).map(order -> order.getBranchId()).orElse(null);
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
        // See payFullInstallmentPlanByWallet: link the plan, the installment and the branch.
        payment.setInstallmentPlanId(installment.getInstallmentPlan().getId());
        payment.setInstallmentId(installment.getId());
        payment.setBranchId(orderBranchId(installment.getInstallmentPlan().getOrderId()));
        paymentRepository.save(payment);
        glPostingService.postWalletPurchase(orderBranchId(installment.getInstallmentPlan().getOrderId()),
                installment.getAmountDue(), payment.getPaymentReference(), userId);

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

        refreshPlanProgress(plan);
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

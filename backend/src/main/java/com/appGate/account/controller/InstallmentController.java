package com.appGate.account.controller;

import com.appGate.account.dto.InitializeDownPaymentDto;
import com.appGate.account.dto.InstallmentPlanDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.InstallmentService;
import com.appGate.account.service.PaymentGatewayService;
import com.appGate.rbac.util.JwtUtils;
import com.appGate.rbac.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InstallmentController {

    private final InstallmentService installmentService;
    private final PaymentGatewayService paymentGatewayService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    /**
     * Preview an installment plan for the caller's current cart. Doesn't require
     * (or accept) an orderId - no order needs to exist yet - and doesn't save
     * anything; the amount financed is priced server-side from the cart, not
     * taken from the request.
     * POST /api/installments/calculate
     */
    @PostMapping("/installments/calculate")
    public BaseResponse calculateInstallmentPlan(@Valid @RequestBody InstallmentPlanDto dto) {
        return installmentService.calculateInstallmentPlan(dto);
    }

    /**
     * Persist the plan once the customer decides to proceed with it. Still has
     * no orderId at this point - pass the returned plan's id as
     * CheckoutDto.installmentPlanId when placing the order; OrderService.checkout()
     * links the two together.
     * POST /api/installments
     */
    @PostMapping("/installments")
    public BaseResponse createInstallmentPlan(@Valid @RequestBody InstallmentPlanDto dto) {
        return installmentService.createInstallmentPlan(dto);
    }

    /**
     * Pay a plan's up-front down payment by bank transfer, before the plan has an
     * order attached. This is how the mobile checkout flow actually works for
     * installment orders: pay the down payment first (against the plan id returned by
     * POST /installments), then call POST /api/orders/checkout with that same
     * installmentPlanId - checkout() picks up the already-collected down payment and
     * reflects it on the new order immediately.
     * <p>
     * The delivery fee is charged here in full, on top of the down payment - it is never
     * spread across the plan's installments. Pass fulfillmentType +
     * deliveryAddress/deliveryStateId/deliveryLgaId in the body (same shape as
     * POST /orders/calculate-delivery-fee) so it can be priced from this request; if you
     * don't, the fee the customer was quoted moments earlier is used instead (see
     * PaymentGatewayService.resolveDownPaymentDeliveryFee).
     * POST /api/installments/{planId}/pay-down-payment/bank-transfer
     */
    @PostMapping("/installments/{planId}/pay-down-payment/bank-transfer")
    public BaseResponse payDownPaymentByBankTransfer(
            @PathVariable Long planId,
            @Valid @RequestBody InitializeDownPaymentDto dto) {
        return paymentGatewayService.initializeDownPaymentBankTransfer(planId, dto);
    }

    /**
     * Same pre-checkout down payment flow, restricted to Paystack's "card" channel
     * instead of "bank_transfer". Use this (never the generic
     * POST /api/payments/card/initialize) for a card-paid down payment - the generic
     * endpoint never links Payment.installmentPlanId, so verifying it can never mark
     * the plan's down payment as collected even though Paystack charges the card.
     * Same optional delivery-fee fields as pay-down-payment/bank-transfer above.
     * POST /api/installments/{planId}/pay-down-payment/card
     */
    @PostMapping("/installments/{planId}/pay-down-payment/card")
    public BaseResponse payDownPaymentByCard(
            @PathVariable Long planId,
            @Valid @RequestBody InitializeDownPaymentDto dto) {
        return paymentGatewayService.initializeDownPaymentCard(planId, dto);
    }

    /**
     * Get installment plan details
     * GET /api/installments/{planId}
     */
    @GetMapping("/installments/{planId}")
    public BaseResponse getInstallmentPlan(@PathVariable Long planId) {
        return installmentService.getInstallmentPlan(planId);
    }

    /**
     * Get all installment plans for a user
     * GET /api/installments/user/{userId}
     */
    @GetMapping("/installments/user/{userId}")
    public BaseResponse getUserInstallmentPlans(@PathVariable Long userId) {
        return installmentService.getUserInstallmentPlans(userId);
    }

    /**
     * Get detailed installment schedule/breakdown
     * GET /api/installments/{planId}/schedule
     */
    @GetMapping("/installments/{planId}/schedule")
    public BaseResponse getInstallmentSchedule(@PathVariable Long planId) {
        return installmentService.getInstallmentSchedule(planId);
    }

    /**
     * Get upcoming payments for a user
     * GET /api/installments/user/{userId}/upcoming
     */
    @GetMapping("/installments/user/{userId}/upcoming")
    public BaseResponse getUpcomingPayments(@PathVariable Long userId) {
        return installmentService.getUpcomingPayments(userId);
    }

    /**
     * Record installment payment (legacy - no wallet deduction)
     * Deprecated: Use /pay/wallet instead for proper wallet deduction
     * POST /api/installments/{installmentId}/pay
     */
    @PostMapping("/installments/{installmentId}/pay")
    public BaseResponse payInstallment(@PathVariable Long installmentId,
                                      @RequestHeader(value = "Authorization", required = false) String token) {
        // Extract userId from Authorization header if available, otherwise from installment plan's userId
        Long userId = null;
        if (token != null && !token.isEmpty()) {
            userId = extractUserIdFromToken(token);
        }
        if (userId == null) {
            return BaseResponse.builder()
                    .status(400)
                    .message("Authorization header required or userId must be provided")
                    .build();
        }
        return installmentService.payInstallment(installmentId, userId);
    }

    /**
     * Pay installment from wallet with proper wallet deduction.
     * {installmentId} must be an individual installment row's ID (from the plan's
     * schedule endpoint below) - NOT the installment plan's ID.
     * POST /api/installments/{installmentId}/pay/wallet
     */
    @PostMapping("/installments/{installmentId}/pay/wallet")
    public BaseResponse payInstallmentByWallet(@PathVariable Long installmentId,
                                               @RequestHeader(value = "Authorization", required = false) String token) {
        // Extract userId from Authorization header
        Long userId = null;
        if (token != null && !token.isEmpty()) {
            userId = extractUserIdFromToken(token);
        }
        if (userId == null) {
            return BaseResponse.builder()
                    .status(400)
                    .message("Authorization header required with valid JWT token")
                    .build();
        }
        return installmentService.payInstallment(installmentId, userId);
    }

    /**
     * Pay whichever installment is next due on a plan. Safe to call with the plan ID
     * returned from /installments/calculate - resolves the correct installment server-side
     * instead of requiring the caller to know a separate installment row ID.
     * POST /api/installments/{planId}/pay-next/wallet
     */
    @PostMapping("/installments/{planId}/pay-next/wallet")
    public BaseResponse payNextInstallmentByWallet(@PathVariable Long planId,
                                                    @RequestHeader(value = "Authorization", required = false) String token) {
        Long userId = null;
        if (token != null && !token.isEmpty()) {
            userId = extractUserIdFromToken(token);
        }
        if (userId == null) {
            return BaseResponse.builder()
                    .status(400)
                    .message("Authorization header required with valid JWT token")
                    .build();
        }
        return installmentService.payNextInstallmentByWallet(planId, userId);
    }

    /**
     * Pay off every remaining installment on a plan in a single wallet debit, settling
     * the plan immediately instead of waiting on each installment's due date. Safe to
     * call with the plan ID returned from /installments/calculate, same as pay-next.
     * POST /api/installments/{planId}/pay-full/wallet
     */
    @PostMapping("/installments/{planId}/pay-full/wallet")
    public BaseResponse payFullInstallmentPlanByWallet(@PathVariable Long planId,
                                                         @RequestHeader(value = "Authorization", required = false) String token) {
        Long userId = null;
        if (token != null && !token.isEmpty()) {
            userId = extractUserIdFromToken(token);
        }
        if (userId == null) {
            return BaseResponse.builder()
                    .status(400)
                    .message("Authorization header required with valid JWT token")
                    .build();
        }
        return installmentService.payFullInstallmentPlanByWallet(planId, userId);
    }

    /**
     * Extract userId from JWT token
     */
    private Long extractUserIdFromToken(String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            String email = jwtUtils.extractEmail(token);
            return userRepository.findByEmail(email)
                    .map(user -> user.getId())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

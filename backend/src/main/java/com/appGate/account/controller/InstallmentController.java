package com.appGate.account.controller;

import com.appGate.account.dto.InstallmentPlanDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.InstallmentService;
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

    // The pre-checkout down-payment endpoints (pay-down-payment/bank-transfer and
    // /card) were removed: the app is order-first now, so the down payment is collected
    // against the order like any other charge (POST /orders/{id}/pay/card, /pay/wallet,
    // or the bank/bank-transfer initialize endpoints with an orderId). They were dead
    // client-side but still open, still moved money, and priced the delivery fee by a
    // different set of rules than the live path.
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


    // The legacy POST /installments/{installmentId}/pay was removed. It was documented as
    // "no wallet deduction" but called exactly the same service method as /pay/wallet - it
    // DID debit the wallet - and being keyed on an installment id meant a plan id passed by
    // mistake would pay an unrelated row. Use /pay/wallet, or the plan-keyed
    // /pay-next/wallet and /pay-full/wallet.

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

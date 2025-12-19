package com.appGate.account.controller;

import com.appGate.account.dto.InstallmentPlanDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.InstallmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InstallmentController {

    private final InstallmentService installmentService;

    /**
     * Calculate and create installment plan
     * POST /api/installments/calculate
     */
    @PostMapping("/installments/calculate")
    public BaseResponse calculateInstallmentPlan(@Valid @RequestBody InstallmentPlanDto dto) {
        return installmentService.calculateInstallmentPlan(dto);
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
     * Record installment payment
     * POST /api/installments/{installmentId}/pay
     */
    @PostMapping("/installments/{installmentId}/pay")
    public BaseResponse payInstallment(@PathVariable Long installmentId) {
        return installmentService.payInstallment(installmentId);
    }
}

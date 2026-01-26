package com.appGate.inventory.controller;

import com.appGate.inventory.dto.AdvancePaymentPlanDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.AdvancePaymentPlanService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/advance-payment-plans")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Advance Payment Plans", description = "Advance payment plan templates")
public class AdvancePaymentPlanController {

    private final AdvancePaymentPlanService planService;

    @Operation(summary = "Create payment plan template", description = "Create reusable payment plan template (e.g., 7 days, 15 days, 30 days, PAY AS BUY, ADO)")
    @PostMapping
    public BaseResponse createPlan(@Valid @RequestBody AdvancePaymentPlanDto dto) {
        return planService.createPlan(dto);
    }

    @Operation(summary = "Get all payment plans", description = "Retrieve all payment plan templates including inactive ones")
    @GetMapping
    public BaseResponse getAllPlans() {
        return planService.getAllPlans();
    }

    @Operation(summary = "Get active payment plans", description = "Retrieve only active payment plan templates available for use")
    @GetMapping("/active")
    public BaseResponse getActivePlans() {
        return planService.getActivePlans();
    }

    @Operation(summary = "Get payment plan by ID", description = "Retrieve specific payment plan template by its ID")
    @GetMapping("/{id}")
    public BaseResponse getPlanById(@PathVariable Long id) {
        return planService.getPlanById(id);
    }

    @Operation(summary = "Update payment plan", description = "Modify existing payment plan template details")
    @PutMapping("/{id}")
    public BaseResponse updatePlan(@PathVariable Long id, @Valid @RequestBody AdvancePaymentPlanDto dto) {
        return planService.updatePlan(id, dto);
    }

    @Operation(summary = "Toggle plan status", description = "Activate or deactivate a payment plan template")
    @PatchMapping("/{id}/toggle")
    public BaseResponse togglePlanStatus(@PathVariable Long id) {
        return planService.togglePlanStatus(id);
    }

    @Operation(summary = "Delete payment plan", description = "Permanently remove a payment plan template")
    @DeleteMapping("/{id}")
    public BaseResponse deletePlan(@PathVariable Long id) {
        return planService.deletePlan(id);
    }
}

package com.appGate.account.controller;

import com.appGate.account.dto.DiscountSetupDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.DiscountSetupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/discount-setups")
@RequiredArgsConstructor
@Tag(name = "Account Management - Discount Setup", description = "Category-based discount configuration")
public class DiscountSetupController {

    private final DiscountSetupService discountSetupService;

    @Operation(summary = "Create discount setup", description = "Configure discount percentage for categories and subcategories")
    @PostMapping
    public BaseResponse createDiscountSetup(@Valid @RequestBody DiscountSetupDto dto) {
        return discountSetupService.createDiscountSetup(dto);
    }

    @Operation(summary = "Get all discount setups", description = "Retrieve all discount configurations")
    @GetMapping
    public BaseResponse getAllDiscountSetups() {
        return discountSetupService.getAllDiscountSetups();
    }

    @Operation(summary = "Get active discount setups", description = "Retrieve only active discount configurations")
    @GetMapping("/active")
    public BaseResponse getActiveDiscountSetups() {
        return discountSetupService.getActiveDiscountSetups();
    }

    @Operation(summary = "Get discount setup by ID", description = "Retrieve specific discount setup")
    @GetMapping("/{id}")
    public BaseResponse getDiscountSetupById(@PathVariable Long id) {
        return discountSetupService.getDiscountSetupById(id);
    }

    @Operation(summary = "Update discount setup", description = "Modify discount configuration")
    @PutMapping("/{id}")
    public BaseResponse updateDiscountSetup(@PathVariable Long id, @Valid @RequestBody DiscountSetupDto dto) {
        return discountSetupService.updateDiscountSetup(id, dto);
    }

    @Operation(summary = "Delete discount setup", description = "Remove discount configuration")
    @DeleteMapping("/{id}")
    public BaseResponse deleteDiscountSetup(@PathVariable Long id) {
        return discountSetupService.deleteDiscountSetup(id);
    }
}

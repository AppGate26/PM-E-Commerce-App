package com.appGate.account.controller;

import com.appGate.account.dto.DeliverySetupDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.DeliverySetupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/delivery-setups")
@RequiredArgsConstructor
@Tag(name = "Account Management - Delivery Setup", description = "Delivery fee configuration by category, weight, and distance")
public class DeliverySetupController {

    private final DeliverySetupService deliverySetupService;

    @Operation(summary = "Create delivery setup", description = "Configure delivery fees based on category, weight range (kg), distance range (km), and GL account")
    @PostMapping
    public BaseResponse createDeliverySetup(@Valid @RequestBody DeliverySetupDto dto) {
        return deliverySetupService.createDeliverySetup(dto);
    }

    @Operation(summary = "Get all delivery setups", description = "Retrieve all delivery fee configurations")
    @GetMapping
    public BaseResponse getAllDeliverySetups() {
        return deliverySetupService.getAllDeliverySetups();
    }

    @Operation(summary = "Get active delivery setups", description = "Retrieve only active delivery fee configurations")
    @GetMapping("/active")
    public BaseResponse getActiveDeliverySetups() {
        return deliverySetupService.getActiveDeliverySetups();
    }

    @Operation(summary = "Get delivery setup by ID", description = "Retrieve specific delivery setup")
    @GetMapping("/{id}")
    public BaseResponse getDeliverySetupById(@PathVariable Long id) {
        return deliverySetupService.getDeliverySetupById(id);
    }

    @Operation(summary = "Update delivery setup", description = "Modify delivery fee configuration")
    @PutMapping("/{id}")
    public BaseResponse updateDeliverySetup(@PathVariable Long id, @Valid @RequestBody DeliverySetupDto dto) {
        return deliverySetupService.updateDeliverySetup(id, dto);
    }

    @Operation(summary = "Delete delivery setup", description = "Remove delivery fee configuration")
    @DeleteMapping("/{id}")
    public BaseResponse deleteDeliverySetup(@PathVariable Long id) {
        return deliverySetupService.deleteDeliverySetup(id);
    }
}

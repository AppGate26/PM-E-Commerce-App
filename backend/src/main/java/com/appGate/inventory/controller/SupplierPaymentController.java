package com.appGate.inventory.controller;

import com.appGate.inventory.dto.SupplierPaymentDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.SupplierPaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/supplier-payments")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Supplier Payments", description = "Record payments made to suppliers")
public class SupplierPaymentController {

    private final SupplierPaymentService supplierPaymentService;

    @Operation(summary = "Record a supplier payment", description = "Record a payment made to a supplier, reducing what is owed to them")
    @PostMapping
    public BaseResponse recordSupplierPayment(@Valid @RequestBody SupplierPaymentDto dto) {
        return supplierPaymentService.recordSupplierPayment(dto);
    }

    @Operation(summary = "Get all supplier payments", description = "Retrieve all supplier payment records")
    @GetMapping
    public BaseResponse getAllSupplierPayments() {
        return supplierPaymentService.getAllSupplierPayments();
    }

    @Operation(summary = "Get payments for a supplier", description = "Retrieve payment history for a specific supplier")
    @GetMapping("/supplier/{supplierId}")
    public BaseResponse getSupplierPaymentsBySupplier(@PathVariable Long supplierId) {
        return supplierPaymentService.getSupplierPaymentsBySupplier(supplierId);
    }
}

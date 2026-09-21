package com.appGate.inventory.controller;

import com.appGate.inventory.dto.PaymentTermDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.PaymentTermService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/payment-terms")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Payment Terms", description = "B2B payment terms management")
public class PaymentTermController {

    private final PaymentTermService paymentTermService;

    @Operation(summary = "Create payment term", description = "Define payment terms for B2B transactions including period, rules, and advance payment details")
    @PostMapping
    public BaseResponse createPaymentTerm(@Valid @RequestBody PaymentTermDto dto) {
        return paymentTermService.createPaymentTerm(dto);
    }

    @Operation(summary = "Get all payment terms", description = "Retrieve all payment terms configured in the system")
    @GetMapping
    public BaseResponse getAllPaymentTerms() {
        return paymentTermService.getAllPaymentTerms();
    }

    @Operation(summary = "Get payment term by ID", description = "Retrieve specific payment term by its ID")
    @GetMapping("/{id}")
    public BaseResponse getPaymentTermById(@PathVariable Long id) {
        return paymentTermService.getPaymentTermById(id);
    }

    @Operation(summary = "Get payment term by invoice number", description = "Retrieve payment terms associated with a specific invoice")
    @GetMapping("/invoice/{invoiceNumber}")
    public BaseResponse getPaymentTermByInvoiceNumber(@PathVariable String invoiceNumber) {
        return paymentTermService.getPaymentTermByInvoiceNumber(invoiceNumber);
    }

    @Operation(summary = "Get payment terms by supplier", description = "Retrieve all payment terms for a specific supplier")
    @GetMapping("/supplier/{supplierId}")
    public BaseResponse getPaymentTermsBySupplier(@PathVariable Long supplierId) {
        return paymentTermService.getPaymentTermsBySupplier(supplierId);
    }

    @Operation(summary = "Update payment term", description = "Modify existing payment term details")
    @PutMapping("/{id}")
    public BaseResponse updatePaymentTerm(@PathVariable Long id, @Valid @RequestBody PaymentTermDto dto) {
        return paymentTermService.updatePaymentTerm(id, dto);
    }

    @Operation(summary = "Delete payment term", description = "Remove a payment term from the system")
    @DeleteMapping("/{id}")
    public BaseResponse deletePaymentTerm(@PathVariable Long id) {
        return paymentTermService.deletePaymentTerm(id);
    }
}

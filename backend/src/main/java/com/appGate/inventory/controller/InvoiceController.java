package com.appGate.inventory.controller;

import com.appGate.inventory.dto.CreateInvoiceDto;
import com.appGate.inventory.enums.InvoiceStatus;
import com.appGate.inventory.enums.InvoiceType;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.InvoiceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/invoices")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Invoice", description = "Invoice and Proforma management")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @Operation(summary = "Create invoice or proforma", description = "Generate new invoice or proforma with auto-generated invoice number and line items")
    @PostMapping
    public BaseResponse createInvoice(@Valid @RequestBody CreateInvoiceDto dto) {
        return invoiceService.createInvoice(dto);
    }

    @Operation(summary = "Get all invoices", description = "Retrieve all invoices and proformas in the system")
    @GetMapping
    public BaseResponse getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @Operation(summary = "Get invoice by ID", description = "Retrieve a specific invoice or proforma by its ID")
    @GetMapping("/{id}")
    public BaseResponse getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }

    @Operation(summary = "Get invoice by number", description = "Search for invoice using invoice number (e.g., PM-INVOICE-NO-2025-0001)")
    @GetMapping("/number/{invoiceNumber}")
    public BaseResponse getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return invoiceService.getInvoiceByNumber(invoiceNumber);
    }

    @Operation(summary = "Generate proforma invoice", description = "Generate a proforma invoice from an existing invoice number. The proforma is a view of the invoice data formatted as a proforma document.")
    @GetMapping("/proforma/{invoiceNumber}")
    public BaseResponse generateProforma(@PathVariable String invoiceNumber) {
        return invoiceService.generateProforma(invoiceNumber);
    }

    @Operation(summary = "Get invoices by type", description = "Filter invoices by type: INVOICE or PROFORMA")
    @GetMapping("/type/{type}")
    public BaseResponse getInvoicesByType(@PathVariable InvoiceType type) {
        return invoiceService.getInvoicesByType(type);
    }

    @Operation(summary = "Get invoices by status", description = "Filter invoices by status: PENDING, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED")
    @GetMapping("/status/{status}")
    public BaseResponse getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        return invoiceService.getInvoicesByStatus(status);
    }

    @Operation(summary = "Get invoices by supplier", description = "Retrieve all invoices for a specific supplier")
    @GetMapping("/supplier/{supplierId}")
    public BaseResponse getInvoicesBySupplier(@PathVariable Long supplierId) {
        return invoiceService.getInvoicesBySupplier(supplierId);
    }

    @Operation(summary = "Get overdue invoices", description = "Retrieve all pending invoices that are past their due date")
    @GetMapping("/overdue")
    public BaseResponse getOverdueInvoices() {
        return invoiceService.getOverdueInvoices();
    }

    @Operation(summary = "Update invoice status", description = "Change the status of an invoice (e.g., mark as PAID, OVERDUE, CANCELLED)")
    @PatchMapping("/{id}/status")
    public BaseResponse updateInvoiceStatus(
            @PathVariable Long id,
            @RequestParam InvoiceStatus status) {
        return invoiceService.updateInvoiceStatus(id, status);
    }

    @Operation(summary = "Delete invoice", description = "Permanently delete an invoice or proforma from the system")
    @DeleteMapping("/{id}")
    public BaseResponse deleteInvoice(@PathVariable Long id) {
        return invoiceService.deleteInvoice(id);
    }
}

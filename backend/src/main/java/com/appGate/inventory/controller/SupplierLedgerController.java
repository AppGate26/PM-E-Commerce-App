package com.appGate.inventory.controller;

import com.appGate.inventory.dto.SupplierLedgerDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.SupplierLedgerService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory/supplier-ledger")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Supplier Ledger", description = "Supplier ledger management")
public class SupplierLedgerController {

    private final SupplierLedgerService supplierLedgerService;

    @Operation(summary = "Add ledger entry", description = "Add a debit or credit entry to a supplier's ledger")
    @PostMapping
    public BaseResponse addLedgerEntry(@Valid @RequestBody SupplierLedgerDto dto) {
        return supplierLedgerService.addLedgerEntry(dto);
    }

    @Operation(summary = "Get supplier ledger", description = "Get all ledger entries for a specific supplier with optional date filter")
    @GetMapping("/supplier/{supplierId}")
    public BaseResponse getLedgerBySupplierId(
            @PathVariable Long supplierId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return supplierLedgerService.getLedgerBySupplierId(supplierId, startDate, endDate, page, size);
    }

    @Operation(summary = "Get all ledger entries", description = "Get all supplier ledger entries paginated")
    @GetMapping
    public BaseResponse getAllLedgerEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return supplierLedgerService.getAllLedgerEntries(page, size);
    }
}

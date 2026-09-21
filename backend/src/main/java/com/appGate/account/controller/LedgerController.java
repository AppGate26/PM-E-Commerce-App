package com.appGate.account.controller;

import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.LedgerService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/ledger")
@RequiredArgsConstructor
@Tag(name = "Account Management - Ledger", description = "General and customer ledger views")
public class LedgerController {

    private final LedgerService ledgerService;

    @Operation(summary = "Get general ledger", description = "Retrieve general ledger transactions with optional filtering by reference number")
    @GetMapping("/general")
    public BaseResponse getGeneralLedger(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String referenceNo) {
        return ledgerService.getGeneralLedger(startDate, endDate, referenceNo);
    }

    @Operation(summary = "Get account ledger", description = "Retrieve ledger for a specific account. Omit startDate/endDate for the account's full history.")
    @GetMapping("/account/{accountId}")
    public BaseResponse getAccountLedger(
            @PathVariable Long accountId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ledgerService.getAccountLedger(accountId, startDate, endDate);
    }

    @Operation(summary = "Get customer ledger", description = "Retrieve ledger for a specific customer. Omit startDate/endDate for the customer's full history.")
    @GetMapping("/customer/{userId}")
    public BaseResponse getCustomerLedger(
            @PathVariable Long userId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ledgerService.getCustomerLedger(userId, startDate, endDate);
    }
}

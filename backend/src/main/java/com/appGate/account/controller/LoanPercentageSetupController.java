package com.appGate.account.controller;

import com.appGate.account.dto.LoanPercentageSetupDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.LoanPercentageSetupService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/loan-percentage-setups")
@RequiredArgsConstructor
@Tag(name = "Account Management - Loan Percentage Setup", description = "Loan interest rate and percentage configuration")
public class LoanPercentageSetupController {

    private final LoanPercentageSetupService loanPercentageSetupService;

    @Operation(summary = "Create loan percentage setup", description = "Configure loan interest rates for categories")
    @PostMapping
    public BaseResponse createLoanPercentageSetup(@Valid @RequestBody LoanPercentageSetupDto dto) {
        return loanPercentageSetupService.createLoanPercentageSetup(dto);
    }

    @Operation(summary = "Get all loan percentage setups", description = "Retrieve all loan percentage configurations")
    @GetMapping
    public BaseResponse getAllLoanPercentageSetups() {
        return loanPercentageSetupService.getAllLoanPercentageSetups();
    }

    @Operation(summary = "Get active loan percentage setups", description = "Retrieve only active loan percentage configurations")
    @GetMapping("/active")
    public BaseResponse getActiveLoanPercentageSetups() {
        return loanPercentageSetupService.getActiveLoanPercentageSetups();
    }

    @Operation(summary = "Get loan percentage setup by ID", description = "Retrieve specific loan percentage setup")
    @GetMapping("/{id}")
    public BaseResponse getLoanPercentageSetupById(@PathVariable Long id) {
        return loanPercentageSetupService.getLoanPercentageSetupById(id);
    }

    @Operation(summary = "Update loan percentage setup", description = "Modify loan percentage configuration")
    @PutMapping("/{id}")
    public BaseResponse updateLoanPercentageSetup(@PathVariable Long id, @Valid @RequestBody LoanPercentageSetupDto dto) {
        return loanPercentageSetupService.updateLoanPercentageSetup(id, dto);
    }

    @Operation(summary = "Delete loan percentage setup", description = "Remove loan percentage configuration")
    @DeleteMapping("/{id}")
    public BaseResponse deleteLoanPercentageSetup(@PathVariable Long id) {
        return loanPercentageSetupService.deleteLoanPercentageSetup(id);
    }
}

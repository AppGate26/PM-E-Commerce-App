package com.appGate.account.controller;

import com.appGate.account.dto.AccountDto;
import com.appGate.account.enums.AccountType;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AccountService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Management - Chart of Accounts", description = "Chart of Accounts and GL Code management")
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "Create account", description = "Create new account in chart of accounts with GL code")
    @PostMapping
    public BaseResponse createAccount(@Valid @RequestBody AccountDto dto) {
        return accountService.createAccount(dto);
    }

    @Operation(summary = "Get all accounts", description = "Retrieve all accounts in the chart of accounts")
    @GetMapping
    public BaseResponse getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @Operation(summary = "Get account by ID", description = "Retrieve a specific account by its ID")
    @GetMapping("/{id}")
    public BaseResponse getAccountById(@PathVariable Long id) {
        return accountService.getAccountById(id);
    }

    @Operation(summary = "Get account by GL Code", description = "Retrieve account using GL code (e.g., 2021101)")
    @GetMapping("/gl-code/{glCode}")
    public BaseResponse getAccountByGlCode(@PathVariable String glCode) {
        return accountService.getAccountByGlCode(glCode);
    }

    @Operation(summary = "Get accounts by type", description = "Filter accounts by type: ASSET, LIABILITY, INCOME, EXPENSE")
    @GetMapping("/type/{accountType}")
    public BaseResponse getAccountsByType(@PathVariable AccountType accountType) {
        return accountService.getAccountsByType(accountType);
    }

    @Operation(summary = "Get control accounts", description = "Retrieve all control accounts")
    @GetMapping("/control-accounts")
    public BaseResponse getControlAccounts() {
        return accountService.getControlAccounts();
    }

    @Operation(summary = "Get active accounts", description = "Retrieve all active accounts")
    @GetMapping("/active")
    public BaseResponse getActiveAccounts() {
        return accountService.getActiveAccounts();
    }

    @Operation(summary = "Update account", description = "Update account details")
    @PutMapping("/{id}")
    public BaseResponse updateAccount(@PathVariable Long id, @Valid @RequestBody AccountDto dto) {
        return accountService.updateAccount(id, dto);
    }

    @Operation(summary = "Delete account", description = "Remove an account from the chart of accounts")
    @DeleteMapping("/{id}")
    public BaseResponse deleteAccount(@PathVariable Long id) {
        return accountService.deleteAccount(id);
    }
}

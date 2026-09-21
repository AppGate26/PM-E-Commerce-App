package com.appGate.account.controller;

import com.appGate.account.dto.CreateAccountDetailsDto;
import com.appGate.account.dto.UpdateAccountDetailsDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AccountDetailsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account-details")
@RequiredArgsConstructor
@Tag(name = "Account Details", description = "Account Details CRUD operations")
public class AccountDetailsController {

    private final AccountDetailsService accountDetailsService;

    @PostMapping
    @Operation(summary = "Create a new Account Details")
    public BaseResponse create(@Valid @RequestBody CreateAccountDetailsDto dto) {
        return accountDetailsService.create(dto);
    }

    @GetMapping
    @Operation(summary = "Get all Account Details (paginated)")
    public BaseResponse getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountDetailsService.getAll(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Account Details by ID")
    public BaseResponse getById(@PathVariable Long id) {
        return accountDetailsService.getById(id);
    }

    @GetMapping("/by-chart/{chartOfAccountId}")
    @Operation(summary = "Get Account Details by Chart of Account ID")
    public BaseResponse getByChartOfAccountId(@PathVariable Long chartOfAccountId) {
        return accountDetailsService.getByChartOfAccountId(chartOfAccountId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Account Details")
    public BaseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAccountDetailsDto dto) {
        return accountDetailsService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Account Details")
    public BaseResponse delete(@PathVariable Long id) {
        return accountDetailsService.delete(id);
    }
}

package com.appGate.account.controller;

import com.appGate.account.dto.CreateChartOfAccountDto;
import com.appGate.account.dto.UpdateChartOfAccountDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.ChartOfAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chart-of-accounts")
@RequiredArgsConstructor
@Tag(name = "Chart of Accounts", description = "Chart of Account CRUD operations")
public class ChartOfAccountController {

    private final ChartOfAccountService chartOfAccountService;

    @PostMapping
    @Operation(summary = "Create a new Chart of Account")
    public BaseResponse create(@Valid @RequestBody CreateChartOfAccountDto dto) {
        return chartOfAccountService.create(dto);
    }

    @GetMapping
    @Operation(summary = "Get all Chart of Accounts (paginated)")
    public BaseResponse getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return chartOfAccountService.getAll(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Chart of Account by ID")
    public BaseResponse getById(@PathVariable Long id) {
        return chartOfAccountService.getById(id);
    }

    @GetMapping("/by-control/{controlAccountId}")
    @Operation(summary = "Get Chart of Accounts by Control Account ID")
    public BaseResponse getByControlAccountId(@PathVariable Long controlAccountId) {
        return chartOfAccountService.getByControlAccountId(controlAccountId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Chart of Account")
    public BaseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateChartOfAccountDto dto) {
        return chartOfAccountService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Chart of Account")
    public BaseResponse delete(@PathVariable Long id) {
        return chartOfAccountService.delete(id);
    }
}

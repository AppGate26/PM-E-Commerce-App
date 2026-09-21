package com.appGate.account.controller;

import com.appGate.account.dto.CreateAccountTypeDto;
import com.appGate.account.dto.UpdateAccountTypeDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AccountTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account-types")
@RequiredArgsConstructor
@Tag(name = "Account Types", description = "Account Type CRUD operations")
public class AccountTypeController {

    private final AccountTypeService accountTypeService;

    @PostMapping
    @Operation(summary = "Create a new Account Type")
    public BaseResponse create(@Valid @RequestBody CreateAccountTypeDto dto) {
        return accountTypeService.create(dto);
    }

    @GetMapping
    @Operation(summary = "Get all Account Types (paginated)")
    public BaseResponse getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accountTypeService.getAll(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Account Type by ID")
    public BaseResponse getById(@PathVariable Long id) {
        return accountTypeService.getById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Account Type")
    public BaseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateAccountTypeDto dto) {
        return accountTypeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Account Type")
    public BaseResponse delete(@PathVariable Long id) {
        return accountTypeService.delete(id);
    }
}

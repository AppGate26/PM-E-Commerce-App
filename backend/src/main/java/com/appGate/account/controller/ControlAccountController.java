package com.appGate.account.controller;

import com.appGate.account.dto.CreateControlAccountDto;
import com.appGate.account.dto.UpdateControlAccountDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.ControlAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/control-accounts")
@RequiredArgsConstructor
@Tag(name = "Control Accounts", description = "Control Account CRUD operations")
public class ControlAccountController {

    private final ControlAccountService controlAccountService;

    @PostMapping
    @Operation(summary = "Create a new Control Account")
    public BaseResponse create(@Valid @RequestBody CreateControlAccountDto dto) {
        return controlAccountService.create(dto);
    }

    @GetMapping
    @Operation(summary = "Get all Control Accounts (paginated)")
    public BaseResponse getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return controlAccountService.getAll(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Control Account by ID")
    public BaseResponse getById(@PathVariable Long id) {
        return controlAccountService.getById(id);
    }

    @GetMapping("/by-type/{accountTypeId}")
    @Operation(summary = "Get Control Accounts by Account Type ID")
    public BaseResponse getByAccountTypeId(@PathVariable Long accountTypeId) {
        return controlAccountService.getByAccountTypeId(accountTypeId);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Control Account")
    public BaseResponse update(@PathVariable Long id, @Valid @RequestBody UpdateControlAccountDto dto) {
        return controlAccountService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Control Account")
    public BaseResponse delete(@PathVariable Long id) {
        return controlAccountService.delete(id);
    }
}

package com.appGate.account.controller;

import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AdminBalanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/balances")
@RequiredArgsConstructor
@Tag(name = "Payment - Admin Balances", description = "Admin balance overview endpoints")
public class AdminBalanceController {

    private final AdminBalanceService adminBalanceService;

    @GetMapping("/customer-balances")
    @Operation(summary = "Get all customer wallet and loan balances")
    public ResponseEntity<BaseResponse> getCustomerBalances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        BaseResponse response = adminBalanceService.getCustomerBalances(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/main-balance")
    @Operation(summary = "Get total wallet balance and paginated transactions")
    public ResponseEntity<BaseResponse> getMainBalance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        BaseResponse response = adminBalanceService.getMainBalance(page, size);
        return ResponseEntity.ok(response);
    }
}

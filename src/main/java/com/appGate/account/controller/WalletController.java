package com.appGate.account.controller;

import com.appGate.account.dto.AddMoneyDto;
import com.appGate.account.dto.TransferDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.WalletService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "Account Management - Wallet", description = "User wallet management and transactions")
public class WalletController {

    private final WalletService walletService;

    @Operation(summary = "Create wallet", description = "Create a new wallet for a user")
    @PostMapping("/create/{userId}")
    public BaseResponse createWallet(@PathVariable Long userId) {
        return walletService.createWallet(userId);
    }

    @Operation(summary = "Get wallet balance", description = "Retrieve current wallet balance for a user")
    @GetMapping("/{userId}/balance")
    public BaseResponse getWalletBalance(@PathVariable Long userId) {
        return walletService.getWalletBalance(userId);
    }

    @Operation(summary = "Add money to wallet", description = "Fund wallet using card payment")
    @PostMapping("/add-money")
    public BaseResponse addMoney(@Valid @RequestBody AddMoneyDto dto) {
        return walletService.addMoney(dto);
    }

    @Operation(summary = "Transfer funds", description = "Transfer funds between user wallets")
    @PostMapping("/transfer")
    public BaseResponse transferFunds(@Valid @RequestBody TransferDto dto) {
        return walletService.transferFunds(dto);
    }

    @Operation(summary = "Get transaction history", description = "Retrieve paginated wallet transaction history")
    @GetMapping("/{userId}/transactions")
    public BaseResponse getTransactionHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return walletService.getTransactionHistory(userId, page, size);
    }

    @Operation(summary = "Verify wallet funding", description = "Verify payment and credit wallet after successful payment")
    @GetMapping("/verify-funding/{paymentReference}")
    public BaseResponse verifyWalletFunding(@PathVariable String paymentReference) {
        return walletService.verifyAndFundWallet(paymentReference);
    }
}

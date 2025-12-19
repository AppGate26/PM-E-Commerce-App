package com.appGate.account.controller;

import com.appGate.account.dto.AddMoneyDto;
import com.appGate.account.dto.TransferDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    /**
     * Create wallet for user
     * POST /api/wallet/create/{userId}
     */
    @PostMapping("/create/{userId}")
    public BaseResponse createWallet(@PathVariable Long userId) {
        return walletService.createWallet(userId);
    }

    /**
     * Get wallet balance
     * GET /api/wallet/{userId}/balance
     */
    @GetMapping("/{userId}/balance")
    public BaseResponse getWalletBalance(@PathVariable Long userId) {
        return walletService.getWalletBalance(userId);
    }

    /**
     * Add money to wallet
     * POST /api/wallet/add-money
     */
    @PostMapping("/add-money")
    public BaseResponse addMoney(@Valid @RequestBody AddMoneyDto dto) {
        return walletService.addMoney(dto);
    }

    /**
     * Transfer funds between wallets
     * POST /api/wallet/transfer
     */
    @PostMapping("/transfer")
    public BaseResponse transferFunds(@Valid @RequestBody TransferDto dto) {
        return walletService.transferFunds(dto);
    }

    /**
     * Get transaction history
     * GET /api/wallet/{userId}/transactions
     */
    @GetMapping("/{userId}/transactions")
    public BaseResponse getTransactionHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return walletService.getTransactionHistory(userId, page, size);
    }

    /**
     * Verify wallet funding payment and credit wallet
     * GET /api/wallet/verify-funding/{paymentReference}
     */
    @GetMapping("/verify-funding/{paymentReference}")
    public BaseResponse verifyWalletFunding(@PathVariable String paymentReference) {
        return walletService.verifyAndFundWallet(paymentReference);
    }
}

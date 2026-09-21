package com.appGate.account.controller;

import com.appGate.account.dto.FundByCardDto;
import com.appGate.account.dto.FundWalletDto;
import com.appGate.account.dto.InitializeCashierTransferDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.PaymentGatewayService;
import com.appGate.account.service.WalletService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cashier/wallet")
@RequiredArgsConstructor
@Tag(name = "Cashier - Wallet", description = "Cashier wallet funding for walk-in customers")
public class CashierWalletController {

    private final WalletService walletService;
    private final PaymentGatewayService paymentGatewayService;

    @Operation(summary = "Fund a walk-in customer's wallet",
            description = "Directly credits the customer's wallet (card = record-only; cash/transfer already collected by the cashier).")
    @PostMapping("/fund")
    public BaseResponse fundWalkInWallet(@RequestBody FundWalletDto dto) {
        return walletService.fundCustomerWallet(dto);
    }

    @Operation(summary = "Fund a wallet by charging a company card",
            description = "Charges a company card via Paystack (redirects to tokenize on first use, instant charge afterwards).")
    @PostMapping("/fund-by-card")
    public BaseResponse fundByCard(@RequestBody FundByCardDto dto) {
        return paymentGatewayService.fundWalletByCompanyCard(dto);
    }

    @Operation(summary = "Start a Paystack bank-transfer wallet funding",
            description = "Initializes a Paystack payment that credits the selected customer's wallet on success.")
    @PostMapping("/initialize-transfer")
    public BaseResponse initializeTransfer(@RequestBody InitializeCashierTransferDto dto) {
        return paymentGatewayService.initializeCashierBankTransfer(dto);
    }

    @Operation(summary = "Verify a cashier wallet funding",
            description = "Verifies the Paystack payment on return and credits the target customer wallet.")
    @GetMapping("/verify-funding/{reference}")
    public BaseResponse verifyFunding(@PathVariable String reference) {
        return paymentGatewayService.verifyCashierWalletFunding(reference);
    }
}

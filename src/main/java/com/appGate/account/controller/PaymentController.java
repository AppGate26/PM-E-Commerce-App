package com.appGate.account.controller;

import com.appGate.account.dto.InitializePaymentDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.PaymentGatewayService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Account Management - Payments", description = "Payment gateway integration and card payments")
public class PaymentController {

    private final PaymentGatewayService paymentGatewayService;

    @Operation(summary = "Initialize card payment", description = "Initialize Paystack card payment for user purchases")
    @PostMapping("/card/initialize")
    public BaseResponse initializeCardPayment(@Valid @RequestBody InitializePaymentDto dto) {
        return paymentGatewayService.initializeCardPayment(dto);
    }

    @Operation(summary = "Verify payment", description = "Verify payment status using payment reference")
    @GetMapping("/verify/{reference}")
    public BaseResponse verifyPayment(@PathVariable String reference) {
        return paymentGatewayService.verifyPayment(reference);
    }

    @Operation(summary = "Paystack webhook", description = "Webhook endpoint for Paystack payment notifications (Public)")
    @PostMapping("/webhook")
    public void handlePaystackWebhook(@RequestBody Map<String, Object> payload) {
        paymentGatewayService.handleWebhook(payload);
    }
}

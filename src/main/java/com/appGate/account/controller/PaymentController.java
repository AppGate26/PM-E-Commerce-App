package com.appGate.account.controller;

import com.appGate.account.dto.InitializePaymentDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.PaymentGatewayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentGatewayService paymentGatewayService;

    /**
     * Initialize card payment
     * POST /api/payments/card/initialize
     */
    @PostMapping("/card/initialize")
    public BaseResponse initializeCardPayment(@Valid @RequestBody InitializePaymentDto dto) {
        return paymentGatewayService.initializeCardPayment(dto);
    }

    /**
     * Verify payment
     * GET /api/payments/verify/{reference}
     */
    @GetMapping("/verify/{reference}")
    public BaseResponse verifyPayment(@PathVariable String reference) {
        return paymentGatewayService.verifyPayment(reference);
    }

    /**
     * Paystack webhook endpoint
     * POST /api/payments/webhook
     */
    @PostMapping("/webhook")
    public void handlePaystackWebhook(@RequestBody Map<String, Object> payload) {
        // Handle Paystack webhooks for payment notifications
        paymentGatewayService.handleWebhook(payload);
    }
}

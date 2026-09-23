package com.appGate.account.controller;

import com.appGate.account.dto.InitializePaymentDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.PaymentGatewayService;
import com.appGate.account.service.CardService;

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
    private final CardService cardService;

    @Operation(summary = "Initialize card payment", description = "Initialize Paystack card payment for user purchases")
    @PostMapping("/card/initialize")
    public BaseResponse initializeCardPayment(@Valid @RequestBody InitializePaymentDto dto) {
        return paymentGatewayService.initializeCardPayment(dto);
    }

    @Operation(summary = "Initialize bank transfer payment", description = "Initialize Paystack bank transfer payment")
    @PostMapping("/bank-transfer/initialize")
    public BaseResponse initializeBankTransferPayment(@Valid @RequestBody InitializePaymentDto dto) {
        return paymentGatewayService.initializeBankTransferPayment(dto);
    }

    @Operation(summary = "Initialize bank payment", description = "Initialize payment using bank account debit")
    @PostMapping("/bank/initialize")
    public BaseResponse initializeBankPayment(@Valid @RequestBody InitializePaymentDto dto) {
        return paymentGatewayService.initializeBankPayment(dto);
    }

    @Operation(summary = "Verify payment", description = "Verify payment status using payment reference")
    @GetMapping("/verify/{reference}")
    public BaseResponse verifyPayment(@PathVariable String reference) {
        return paymentGatewayService.verifyPayment(reference);
    }

    // Public by necessity (SecurityConfig), so the signature IS the authentication: the body
    // is taken raw, because the HMAC must be computed over exactly the bytes Paystack signed -
    // deserializing to a Map first and re-serializing would change them and never match.
    @Operation(summary = "Paystack webhook", description = "Webhook endpoint for Paystack payment notifications (Public, signature-verified)")
    @PostMapping("/webhook")
    public void handlePaystackWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        paymentGatewayService.handleWebhook(rawPayload, signature);
    }

    @Operation(summary = "Add payment card", description = "Add a new payment card to user's profile")
    @PostMapping("/cards")
    public BaseResponse addPaymentCard(@RequestBody Map<String, Object> cardData) {
        return cardService.addPaymentCard(cardData);
    }

    @Operation(summary = "Get payment cards", description = "Get all active payment cards")
    @GetMapping("/cards")
    public BaseResponse getPaymentCards() {
        return cardService.getPaymentCards();
    }

    @Operation(summary = "Update payment card", description = "Update payment card details by ID")
    @PutMapping("/cards/{cardId}")
    public BaseResponse updatePaymentCard(
            @PathVariable Long cardId,
            @RequestBody Map<String, Object> cardData) {
        return cardService.updatePaymentCard(cardId, cardData);
    }

    @Operation(summary = "Delete payment card", description = "Delete a payment card by ID")
    @DeleteMapping("/cards/{cardId}")
    public BaseResponse deletePaymentCard(@PathVariable Long cardId) {
        return cardService.deletePaymentCard(cardId);
    }
}

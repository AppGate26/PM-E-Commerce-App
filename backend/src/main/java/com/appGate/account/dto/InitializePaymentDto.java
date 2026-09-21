package com.appGate.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InitializePaymentDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private Double amount;

    @NotBlank(message = "Callback URL is required")
    private String callbackUrl;

    // Optional. When set, this payment is charged against the order's own
    // server-computed amount (down payment for an installment order, full grandTotal
    // otherwise) instead of `amount` above, and gets linked to the order so it's
    // reflected on every admin/mobile order-status screen once Paystack confirms it -
    // see PaymentGatewayService.initializeBankTransferPayment/initializeBankPayment.
    // Leave null for a plain wallet top-up/direct payment with no order attached.
    private Long orderId;
}

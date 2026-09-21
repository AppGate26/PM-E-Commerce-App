package com.appGate.account.dto;

import lombok.Data;

@Data
public class InitializeCashierTransferDto {
    private Long customerId;
    private String accountNumber;
    private String customerName;
    private Double amount;
    private String email;
    private String enteredBy;
    private String description;
    private String callbackUrl;

    // Optional: "CARD" or "BANK_TRANSFER". Restricts which channel Paystack's hosted
    // checkout shows. Left blank, the checkout shows every channel Paystack supports.
    private String paymentChannel;
}

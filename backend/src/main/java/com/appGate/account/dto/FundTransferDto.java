package com.appGate.account.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FundTransferDto {

    @NotNull(message = "From account ID is required")
    private Long fromAccountId; // Company GL account to debit

    // Optional: only supplied for a legacy GL-to-GL transfer. For the primary flow
    // (fund a customer's wallet) the credit side is the customer's wallet, resolved
    // from customerId, so no destination GL account is required.
    private Long toAccountId;

    private Long customerId; // Customer whose wallet is credited

    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private LocalDate transactionDate;

    private String referenceNo;
}

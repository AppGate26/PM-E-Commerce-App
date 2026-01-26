package com.appGate.account.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FundTransferDto {

    @NotNull(message = "From account ID is required")
    private Long fromAccountId; // GL Account

    @NotNull(message = "To account ID is required")
    private Long toAccountId; // GL Account

    private Long customerId; // Optional customer ID

    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private LocalDate transactionDate;

    private String referenceNo;
}

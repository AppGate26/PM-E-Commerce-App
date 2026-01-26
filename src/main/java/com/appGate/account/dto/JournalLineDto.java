package com.appGate.account.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class JournalLineDto {

    @NotNull(message = "Account ID is required")
    private Long accountId;

    private String description;

    private BigDecimal debit;

    private BigDecimal credit;

    private Long userId; // For customer ledger

    private String referenceNo;
}

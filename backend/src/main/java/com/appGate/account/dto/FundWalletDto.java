package com.appGate.account.dto;

import lombok.Data;

@Data
public class FundWalletDto {
    private Long customerId;
    private String accountNumber;
    private Double amount;
    private String customerName;
    private String description;
    private String enteredBy;
    private String fundingMethod;
    // companyCardId comes from the frontend as a numeric string; kept as String so an empty
    // value never breaks deserialization. Resolved to a CompanyCard when fundingMethod == CARD.
    private String companyCardId;
    private String referenceNumber;
}

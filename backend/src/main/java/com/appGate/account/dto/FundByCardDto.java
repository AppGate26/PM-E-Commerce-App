package com.appGate.account.dto;

import lombok.Data;

@Data
public class FundByCardDto {
    private Long customerId;
    private String accountNumber;
    private String customerName;
    private Double amount;
    private String companyCardId; // String so an empty value never breaks deserialization.
    private String enteredBy;
    private String description;
    private String callbackUrl;
}

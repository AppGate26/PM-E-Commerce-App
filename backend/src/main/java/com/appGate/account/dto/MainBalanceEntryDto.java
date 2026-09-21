package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MainBalanceEntryDto {

    private String customerName;
    private String accountNumber;
    private Double amount;
    private LocalDateTime dateOfTransaction;
}

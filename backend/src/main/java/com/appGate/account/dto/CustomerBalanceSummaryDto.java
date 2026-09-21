package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerBalanceSummaryDto {

    private String customerName;
    private Long customerId;
    private LocalDateTime lastTransactionDate;
    private LocalDate lastRepaymentDate;
    private Double walletBalance;
    private Double loanBalance;
}

package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanScheduleEntryDto {
    private Integer entryNumber;
    private BigDecimal amountDue;
    private BigDecimal principalPortion;
    private BigDecimal interestPortion;
    private BigDecimal outstandingBalance;
    private LocalDate dueDate;
}

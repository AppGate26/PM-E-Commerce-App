package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanInfoDto {
    private String loanType;
    private BigDecimal productAmount;
    private String repaymentMethod;
    private String duration;
    private BigDecimal rate;
    private BigDecimal interestOnLoan;
    private BigDecimal principalRepayment;
    private String startDate;
    private String expirationDate;
    private String officerInCharge;
    private BigDecimal upfrontCharges;
}

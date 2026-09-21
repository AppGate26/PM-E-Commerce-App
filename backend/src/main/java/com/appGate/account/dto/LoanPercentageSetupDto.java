package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanPercentageSetupDto {
    private String categoryName;
    private BigDecimal setupRate;
    private BigDecimal newRate;
    private String incomeGlCode;
    private String loanInterestType;
    private Boolean isActive;
}

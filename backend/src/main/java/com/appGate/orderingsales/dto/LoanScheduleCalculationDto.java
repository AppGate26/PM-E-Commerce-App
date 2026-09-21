package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanScheduleCalculationDto {
    private BigDecimal productAmount;
    private BigDecimal rate;            // e.g. 5.00 for 5%
    private String duration;            // e.g. "5M"
    private String repaymentMethod;     // MONTHLY, WEEKLY, BI-WEEKLY
    private String startDate;           // yyyy-MM-dd
}

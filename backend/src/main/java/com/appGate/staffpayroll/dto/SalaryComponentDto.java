package com.appGate.staffpayroll.dto;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SalaryComponentDto {
    private SalaryComponentType componentType;
    private String name;
    private BigDecimal amount;
    private Boolean isPercentage;
    private BigDecimal percentageValue;
    private Long payrollAccountId;
}

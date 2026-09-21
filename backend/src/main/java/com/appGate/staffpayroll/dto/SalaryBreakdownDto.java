package com.appGate.staffpayroll.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SalaryBreakdownDto {
    private Long staffId;
    private BigDecimal basicSalary;
    private List<SalaryComponentDto> components;
}

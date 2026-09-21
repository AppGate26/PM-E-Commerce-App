package com.appGate.staffpayroll.dto;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import lombok.Data;

@Data
public class PayrollAccountDto {
    private SalaryComponentType componentType;
    private String accountGlCode;
    private String accountName;
    private String description;
}

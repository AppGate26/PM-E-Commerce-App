package com.appGate.staffpayroll.dto;

import lombok.Data;

@Data
public class StatutoryInfoDto {
    private Long staffId;
    private String taxId;
    private String pensionNumber;
    private String nhfNumber;
}

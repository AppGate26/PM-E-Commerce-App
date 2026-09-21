package com.appGate.staffpayroll.dto;

import lombok.Data;

@Data
public class StaffBankDetailsDto {
    private Long staffId;
    private String bankName;
    private String accountNumber;
    private String accountName;
}

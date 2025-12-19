package com.appGate.rbac.dto;

import lombok.Data;

@Data
public class BankDetailsDto {

    private Long userId;
    private String accountNumber;
    private String accountName;
    private String bankName;
    private String bvn;
    private String nin; 
}

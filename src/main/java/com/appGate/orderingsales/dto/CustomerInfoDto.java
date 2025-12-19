package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerInfoDto {
    private String customerName;
    private String accountNumber;
    private String email;
    private String phoneNumber;
    private String address;
    private String dob;
    private String gender;
    private String occupation;
    private String customerBankAccount;
}

package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountDetailsDto {

    @NotNull(message = "Account Type ID is required")
    private Long accountTypeId;

    @NotNull(message = "Control Account ID is required")
    private Long controlAccountId;

    @NotNull(message = "Chart of Account ID is required")
    private Long chartOfAccountId;

    @NotBlank(message = "Account Details Code is required")
    private String accountDetailsCode;

    @NotBlank(message = "Account Details Name is required")
    private String accountDetailsName;
}

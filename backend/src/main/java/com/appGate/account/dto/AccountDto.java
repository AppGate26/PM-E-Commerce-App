package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountDto {

    @NotBlank(message = "GL Code is required")
    private String glCode;

    @NotBlank(message = "Account name is required")
    private String accountName;

    private String description;

    @NotNull(message = "Account type ID is required")
    private Long accountTypeId;

    private Integer classId;

    private Boolean isControlAccount;

    private Long parentAccountId;
}

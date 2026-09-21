package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateChartOfAccountDto {

    @NotNull(message = "Account Type ID is required")
    private Long accountTypeId;

    @NotNull(message = "Control Account ID is required")
    private Long controlAccountId;

    @NotBlank(message = "Chart of Account ID is required")
    private String chartOfAccountId;

    @NotBlank(message = "Description is required")
    private String description;
}

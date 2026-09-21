package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateControlAccountDto {

    @NotNull(message = "Account Type ID is required")
    private Long accountTypeId;

    @NotBlank(message = "Control ID is required")
    private String controlId;

    @NotBlank(message = "Name is required")
    private String name;
}

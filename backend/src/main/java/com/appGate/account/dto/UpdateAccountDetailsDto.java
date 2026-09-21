package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAccountDetailsDto {

    @NotBlank(message = "Account Details Name is required")
    private String accountDetailsName;
}

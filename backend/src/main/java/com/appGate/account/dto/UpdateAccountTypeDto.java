package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAccountTypeDto {

    @NotBlank(message = "Name is required")
    private String name;
}

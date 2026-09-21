package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAccountTypeDto {

    @NotBlank(message = "Name is required")
    private String name;
}

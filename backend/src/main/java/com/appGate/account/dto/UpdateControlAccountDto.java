package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateControlAccountDto {

    @NotBlank(message = "Name is required")
    private String name;
}

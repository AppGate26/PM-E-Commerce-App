package com.appGate.recovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyRecoveryDto {

    @NotBlank(message = "Token or code is required")
    private String tokenOrCode;
}

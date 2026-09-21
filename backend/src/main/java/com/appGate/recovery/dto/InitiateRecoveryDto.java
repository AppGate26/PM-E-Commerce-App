package com.appGate.recovery.dto;

import com.appGate.recovery.enums.RecoveryType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InitiateRecoveryDto {

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    @NotNull(message = "Recovery type is required")
    private RecoveryType recoveryType;
}

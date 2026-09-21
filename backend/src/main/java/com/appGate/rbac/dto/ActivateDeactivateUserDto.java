package com.appGate.rbac.dto;

import com.appGate.rbac.enums.UserStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActivateDeactivateUserDto {
    @NotNull(message = "Email is required")
    private String email;

    @NotNull(message = "Status is required")
    private UserStatusEnum status;

    private String warningMessage;
}

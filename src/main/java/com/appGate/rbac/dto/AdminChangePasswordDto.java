package com.appGate.rbac.dto;

import com.appGate.rbac.enums.RoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminChangePasswordDto {
    @NotNull(message = "Email is required")
    private String email;

    @NotNull(message = "Current password is required")
    private String currentPassword;

    @NotNull(message = "New password is required")
    private String newPassword;

    @NotNull(message = "Verify new password is required")
    private String verifyNewPassword;

    private String userCode;
    private RoleEnum userRole;

    // Password reminder fields
    private String securityQuestion;
    private String securityAnswer;
}

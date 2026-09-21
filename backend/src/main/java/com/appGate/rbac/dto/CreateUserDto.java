package com.appGate.rbac.dto;

import com.appGate.rbac.enums.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserDto {
    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Password is required")
    private String password;

    private String verifyPassword;

    private String userCode;

    @NotNull(message = "Role is required")
    private RoleEnum role;

    private String department;

    // Password reminder fields
    private String securityQuestion;
    private String securityAnswer;

    // Branch assignment (required for all roles except SUPER_ADMIN)
    private Long branchId;
}

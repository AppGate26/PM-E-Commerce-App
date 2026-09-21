package com.appGate.rbac.dto;

import com.appGate.rbac.enums.PermissionEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class AssignPermissionsDto {
    @NotNull(message = "Email is required")
    private String email;

    @NotNull(message = "Permissions are required")
    private Set<PermissionEnum> permissions;
}

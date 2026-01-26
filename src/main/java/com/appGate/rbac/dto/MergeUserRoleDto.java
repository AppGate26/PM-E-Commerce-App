package com.appGate.rbac.dto;

import com.appGate.rbac.enums.RoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class MergeUserRoleDto {
    @NotNull(message = "Email is required")
    private String email;

    private RoleEnum currentRole;

    private List<RoleEnum> attachRoles;

    private RoleEnum detachRole;
}

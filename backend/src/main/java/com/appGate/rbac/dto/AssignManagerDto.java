package com.appGate.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignManagerDto {

    @NotNull(message = "Manager user ID is required")
    private Long managerId;
}

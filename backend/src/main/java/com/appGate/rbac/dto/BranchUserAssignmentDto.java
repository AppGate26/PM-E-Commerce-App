package com.appGate.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BranchUserAssignmentDto {

    @NotNull(message = "Email is required")
    private String email;

    private Long branchId;

    private Long warehouseId;

    private String warehouseName;

    private String jobRole;

    // HEAD_OFFICE | BRANCH (optional; derived from the branch when absent)
    private String locationType;

    // HEAD_OFFICE_AND_BRANCHES | BRANCH_ONLY (optional; derived from locationType when absent)
    private String approvalScope;
}

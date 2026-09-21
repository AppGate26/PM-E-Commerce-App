package com.appGate.rbac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BranchDto {

    @NotBlank(message = "Branch name is required")
    private String branchName;

    private String address;

    private Long stateId;

    private Long lgaId;

    private Long wardId;

    private String phone;

    private String email;

    private Long managerId;
}

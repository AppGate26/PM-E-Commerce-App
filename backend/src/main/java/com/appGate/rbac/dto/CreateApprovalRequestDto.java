package com.appGate.rbac.dto;

import com.appGate.rbac.enums.ApprovalType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateApprovalRequestDto {

    @NotNull(message = "Approval type is required")
    private ApprovalType approvalType;

    private Long entityId;

    @NotNull(message = "Requested by user ID is required")
    private Long requestedBy;

    @NotNull(message = "Request data is required")
    private String requestData; // JSON string of the data to be approved

    private String comments;
}

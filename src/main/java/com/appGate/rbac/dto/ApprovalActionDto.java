package com.appGate.rbac.dto;

import lombok.Data;

@Data
public class ApprovalActionDto {

    private String comments;

    private String declineReason; // Required when declining

    private Long approvedBy; // User ID performing the action
}

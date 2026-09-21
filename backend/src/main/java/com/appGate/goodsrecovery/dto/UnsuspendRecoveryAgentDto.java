package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnsuspendRecoveryAgentDto {
    @NotBlank(message = "Reason for unblocking is required")
    private String reasonForUnblocking;
}

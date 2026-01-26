package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SuspendRecoveryAgentDto {
    @NotBlank(message = "Reason for suspension is required")
    private String reasonForSuspension;
}

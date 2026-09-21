package com.appGate.account.dto;

import com.appGate.account.enums.DisputeResolution;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolveDisputeDto {

    @NotNull(message = "Resolution is required")
    private DisputeResolution resolution;

    private String adminNotes;

    @NotNull(message = "Resolved by (admin user ID) is required")
    private Long resolvedBy;
}

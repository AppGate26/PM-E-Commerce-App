package com.appGate.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

/**
 * Payload for denying a user access to specific sub-features (e.g.
 * "accounting.staffpayroll"). A denied feature hides/blocks that screen even
 * when the parent module permission is granted.
 */
@Data
public class AssignDeniedFeaturesDto {
    @NotNull(message = "Email is required")
    private String email;

    private Set<String> deniedFeatures = new HashSet<>();
}

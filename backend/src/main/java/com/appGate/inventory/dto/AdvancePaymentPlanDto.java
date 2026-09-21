package com.appGate.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdvancePaymentPlanDto {

    @NotBlank(message = "Plan name is required")
    private String planName;

    private Integer percentagePaymentMade;

    private String timelineOfDeliverables;

    private String paymentMilestones;

    private String description;

    private Boolean isActive;
}

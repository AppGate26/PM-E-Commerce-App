package com.appGate.delivery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RiderFeedbackDto {

    @NotNull(message = "Rider ID is required")
    private Long riderId;

    private String riderName;

    private Long orderId;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer deliveryRating;

    private String customerFeedback;

    private String issuesEncountered;

    private String suggestions;

    private String feedbackType; // POSITIVE, NEGATIVE, NEUTRAL
}

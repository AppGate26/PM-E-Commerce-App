package com.appGate.delivery.dto;

import com.appGate.delivery.enums.FeedbackStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryFeedbackDto {

    @NotNull(message = "Rider box ID is required")
    private Long riderBoxId;

    @NotBlank(message = "Delivery agent name is required")
    private String deliveryAgentName;

    private Long productId;

    private String customerName;

    @NotNull(message = "Status is required")
    private FeedbackStatus status;
}

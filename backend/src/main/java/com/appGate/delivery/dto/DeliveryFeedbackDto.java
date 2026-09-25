package com.appGate.delivery.dto;

import com.appGate.delivery.enums.FeedbackStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryFeedbackDto {

    @NotNull(message = "Rider box ID is required")
    private Long riderBoxId;

    // deliveryAgentName/productId/customerName are filled in from the rider box when the
    // app leaves them out (see DeliveryOperationsService.submitFeedback), so the rider
    // doesn't have to type them.
    private String deliveryAgentName;

    private Long productId;

    private String customerName;

    @NotNull(message = "Status is required")
    private FeedbackStatus status;
}

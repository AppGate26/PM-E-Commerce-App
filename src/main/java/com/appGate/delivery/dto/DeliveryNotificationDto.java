package com.appGate.delivery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryNotificationDto {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private Long riderId;

    private String customerName;

    private String productName;

    private String deliveryAddress;

    @NotNull(message = "Notification type is required")
    private String notificationType; // ORDER_ASSIGNED, IN_TRANSIT, DELIVERED, FAILED

    @NotNull(message = "Message is required")
    private String message;

    private LocalDateTime notificationDate;
}

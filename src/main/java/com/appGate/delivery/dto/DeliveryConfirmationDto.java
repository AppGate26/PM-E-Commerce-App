package com.appGate.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Data
public class DeliveryConfirmationDto {

    @NotNull(message = "Rider box ID is required")
    private Long riderBoxId;

    @NotBlank(message = "Delivery agent name is required")
    private String deliveryAgentName;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    @NotBlank(message = "Item of delivery is required")
    private String itemOfDelivery;

    private MultipartFile proofOfDeliveryImage;

    private LocalDateTime timeOfDelivery;
}

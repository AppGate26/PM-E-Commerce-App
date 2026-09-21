package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Data
public class MarkAsRecoveredDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Product ID is required")
    private Long productId;

    private MultipartFile recoveryPhoto;

    private LocalDateTime timeOfRecovery;

    @NotNull(message = "Number of items recovered is required")
    private Integer numberOfItemsRecovered;

    @NotNull(message = "Recovery agent ID is required")
    private Long recoveryAgentId;
}

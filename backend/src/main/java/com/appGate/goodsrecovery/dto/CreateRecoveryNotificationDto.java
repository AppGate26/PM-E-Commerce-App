package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateRecoveryNotificationDto {

    @NotNull(message = "Recovery agent ID is required")
    private Long recoveryAgentId;

    @NotNull(message = "Title is required")
    private String title;

    @NotNull(message = "Message is required")
    private String message;

    private String notificationType; // ASSIGNMENT, STATUS_UPDATE, REMINDER, etc.

    private Long relatedRecoveryId; // Optional reference to GoodsRecovery

    private Long relatedBoxId; // Optional reference to RecoveryBox
}

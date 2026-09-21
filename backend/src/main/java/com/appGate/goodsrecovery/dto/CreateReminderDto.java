package com.appGate.goodsrecovery.dto;

import com.appGate.goodsrecovery.enums.RecipientType;
import com.appGate.goodsrecovery.enums.RelatedEntityType;
import com.appGate.goodsrecovery.enums.ReminderType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateReminderDto {

    @NotNull(message = "Recipient type is required")
    private RecipientType recipientType;

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    private String recipientName;

    private String recipientEmail;

    private String recipientPhone;

    @NotNull(message = "Reminder type is required")
    private ReminderType reminderType;

    @NotNull(message = "Message is required")
    private String message;

    private LocalDateTime scheduledDate; // If null, defaults to now

    private RelatedEntityType relatedEntityType;

    private Long relatedEntityId;

    private String notes;
}

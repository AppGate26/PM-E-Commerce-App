package com.appGate.goodsrecovery.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateReminderDto {

    private String message;

    private LocalDateTime scheduledDate;

    private String recipientName;

    private String recipientEmail;

    private String recipientPhone;

    private String notes;
}

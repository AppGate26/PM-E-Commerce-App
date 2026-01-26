package com.appGate.mail.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComposeMailDto {
    @NotNull(message = "Recipient is required")
    private Long recipientId;

    @NotNull(message = "Subject is required")
    private String subject;

    @NotNull(message = "Message is required")
    private String message;
}

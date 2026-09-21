package com.appGate.mail.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InternalMailResponseDto {
    private Long id;
    private Long senderId;
    private String senderEmail;
    private String senderName;
    private Long recipientId;
    private String recipientEmail;
    private String recipientName;
    private String subject;
    private String message;
    private Boolean isRead;
    private LocalDateTime sentAt;
}

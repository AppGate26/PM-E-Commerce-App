package com.appGate.mail.dto;

import com.appGate.mail.enums.MailTypeEnum;
import lombok.Data;

@Data
public class MailSettingsDto {
    private String emailAddress;
    private String senderName;
    private String smtpEmailAddress;
    private String smtpEmailPassword;
    private String smtpSenderName;
    private MailTypeEnum mailDisplayOption;
}

package com.appGate.mail.models;

import com.appGate.mail.enums.MailTypeEnum;
import com.appGate.rbac.models.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "mail_settings")
public class MailSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(name = "email_address")
    private String emailAddress;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "smtp_email_address")
    private String smtpEmailAddress;

    @Column(name = "smtp_email_password")
    private String smtpEmailPassword;

    @Column(name = "smtp_sender_name")
    private String smtpSenderName;

    @Enumerated(EnumType.STRING)
    @Column(name = "mail_display_option")
    private MailTypeEnum mailDisplayOption = MailTypeEnum.INTERNAL;
}

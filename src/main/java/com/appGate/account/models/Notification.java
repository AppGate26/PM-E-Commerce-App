package com.appGate.account.models;

import com.appGate.account.enums.NotificationStatus;
import com.appGate.account.enums.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private NotificationStatus status = NotificationStatus.UNREAD;

    @Column(name = "related_entity_id")
    private Long relatedEntityId; // Order ID, Payment ID, etc.

    @Column(name = "related_entity_type")
    private String relatedEntityType; // "ORDER", "PAYMENT", "INSTALLMENT", etc.

    @Column(name = "action_url")
    private String actionUrl; // Deep link to related entity

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_push_sent")
    private Boolean isPushSent = false;

    @Column(name = "is_email_sent")
    private Boolean isEmailSent = false;

    @Column(name = "is_sms_sent")
    private Boolean isSmsSent = false;
}

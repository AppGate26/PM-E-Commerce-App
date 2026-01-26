package com.appGate.goodsrecovery.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "recovery_notifications")
public class RecoveryNotification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goods_recovery_id")
    private Long goodsRecoveryId;

    @Column(name = "recovery_agent_id")
    private Long recoveryAgentId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_address", length = 500)
    private String customerAddress;

    @Column(name = "notification_type")
    private String notificationType; // ASSIGNMENT, IN_PROGRESS, RECOVERED, FAILED

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "notification_date")
    private LocalDateTime notificationDate;
}

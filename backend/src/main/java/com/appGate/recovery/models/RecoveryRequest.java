package com.appGate.recovery.models;

import com.appGate.recovery.enums.RecoveryStatus;
import com.appGate.recovery.enums.RecoveryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "recovery_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RecoveryRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "recovery_type", nullable = false)
    private RecoveryType recoveryType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RecoveryStatus status = RecoveryStatus.PENDING;

    @Column(name = "recovery_token", unique = true)
    private String recoveryToken; // UUID token for email links

    @Column(name = "recovery_code")
    private String recoveryCode; // 6-digit code for SMS/Email

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "attempt_count")
    private Integer attemptCount = 0;

    @Column(name = "max_attempts")
    private Integer maxAttempts = 5;
}

package com.appGate.rbac.models;

import com.appGate.rbac.enums.ApprovalStatus;
import com.appGate.rbac.enums.ApprovalType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_requests")
@Data
public class ApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_type", nullable = false)
    private ApprovalType approvalType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "entity_id")
    private Long entityId; // ID of the entity being approved (stock, customer, supplier, etc.)

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy; // User ID who created the request

    @Column(name = "approved_by")
    private Long approvedBy; // User ID who approved/declined

    @Column(name = "request_data", columnDefinition = "TEXT")
    private String requestData; // JSON string of the request details

    @Column(name = "comments", length = 1000)
    private String comments; // Approval/decline comments

    @Column(name = "decline_reason", length = 500)
    private String declineReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}

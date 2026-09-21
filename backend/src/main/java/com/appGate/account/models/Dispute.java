package com.appGate.account.models;

import com.appGate.account.enums.DisputeCategory;
import com.appGate.account.enums.DisputeResolution;
import com.appGate.account.enums.DisputeStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "disputes")
public class Dispute extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DisputeStatus status = DisputeStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution")
    private DisputeResolution resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private DisputeCategory category;

    @Column(name = "disputed_amount", nullable = false)
    private Double disputedAmount;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "evidence", length = 2000)
    private String evidence;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by")
    private Long resolvedBy;
}

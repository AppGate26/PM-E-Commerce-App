package com.appGate.orderingsales.models;

import com.appGate.orderingsales.enums.RefundMethod;
import com.appGate.orderingsales.enums.ReturnMethod;
import com.appGate.orderingsales.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ReturnRequest extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "sales_order_id", nullable = false)
    private Long salesOrderId;

    @Column(name = "reference_no", nullable = false)
    private String referenceNo;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "reason", length = 1000, nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_method", nullable = false)
    private ReturnMethod returnMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_method", nullable = false)
    private RefundMethod refundMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReturnStatus status = ReturnStatus.PENDING;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // For RECEIVE_OTHER_PRODUCT — the replacement product name/id
    @Column(name = "replacement_product_id")
    private Long replacementProductId;

    @Column(name = "replacement_product_name")
    private String replacementProductName;

    // Set when the return is restored (repaired) — see RESTORED status
    @Column(name = "restoration_received_at")
    private LocalDate restorationReceivedAt;

    @Column(name = "restoration_completed_at")
    private LocalDate restorationCompletedAt;

    @Column(name = "restoration_description", length = 1000)
    private String restorationDescription;
}

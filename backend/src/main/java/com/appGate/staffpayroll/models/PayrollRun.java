package com.appGate.staffpayroll.models;

import com.appGate.rbac.context.BranchOwned;
import com.appGate.staffpayroll.enums.PayrollStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** A payroll run is executed for one branch; head office runs carry a null branch. */
@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "payroll_runs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PayrollRun extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "period", nullable = false)
    private String period;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PayrollStatus status = PayrollStatus.PENDING;

    @Column(name = "initiated_by")
    private Long initiatedBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "notes", length = 500)
    private String notes;
}

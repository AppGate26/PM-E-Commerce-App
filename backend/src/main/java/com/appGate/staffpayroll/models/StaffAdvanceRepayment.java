package com.appGate.staffpayroll.models;

import com.appGate.rbac.context.BranchOwned;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "staff_advance_repayment")
public class StaffAdvanceRepayment extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "advance_id")
    private Long advanceId;

    @Column(name = "staff_id")
    private Long staffId;

    @Column(name = "repayment_date")
    private LocalDate repaymentDate;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "month", length = 7)
    private String month; // Format: YYYY-MM

    @Column(name = "status", length = 20)
    private String status = "PENDING"; // PENDING, COMPLETED, OVERDUE

    @Column(name = "recorded_by")
    private Long recordedBy;

    @Column(name = "remarks", length = 500)
    private String remarks;
}

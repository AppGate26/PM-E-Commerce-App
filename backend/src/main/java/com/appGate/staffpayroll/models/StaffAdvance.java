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
@Table(name = "staff_advance")
public class StaffAdvance extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "staff_id")
    private Long staffId;

    @Column(name = "staff_code")
    private String staffCode;

    @Column(name = "staff_name")
    private String staffName;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "tenure")
    private Integer tenure;

    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "total_repayment", precision = 15, scale = 2)
    private BigDecimal totalRepayment;

    @Column(name = "monthly_deduction", precision = 15, scale = 2)
    private BigDecimal monthlyDeduction;

    @Column(name = "receiver_account_name")
    private String receiverAccountName;

    @Column(name = "receiver_account_number")
    private String receiverAccountNumber;

    @Column(name = "receiver_bank_name")
    private String receiverBankName;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "status")
    private String status = "PENDING"; // PENDING -> APPROVED -> DISBURSED

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "disbursed_by")
    private Long disbursedBy;

    @Column(name = "disbursed_date")
    private LocalDate disbursedDate;
}

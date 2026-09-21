package com.appGate.staffpayroll.models;

import com.appGate.rbac.context.BranchOwned;
import com.appGate.staffpayroll.enums.PayrollStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "payroll_entries")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PayrollEntry extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "payroll_run_id", nullable = false)
    private Long payrollRunId;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "staff_name")
    private String staffName;

    @Column(name = "basic_salary", precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private PayrollStatus status = PayrollStatus.PENDING;
}

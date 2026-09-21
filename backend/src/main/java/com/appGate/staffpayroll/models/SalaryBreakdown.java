package com.appGate.staffpayroll.models;

import com.appGate.rbac.context.BranchOwned;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "salary_breakdowns")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryBreakdown extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "staff_id", nullable = false, unique = true)
    private Long staffId;

    @Column(name = "basic_salary", precision = 15, scale = 2, nullable = false)
    private BigDecimal basicSalary;

    @Column(name = "gross_salary", precision = 15, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "net_salary", precision = 15, scale = 2)
    private BigDecimal netSalary;
}

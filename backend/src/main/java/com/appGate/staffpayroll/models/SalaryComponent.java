package com.appGate.staffpayroll.models;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "salary_components")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryComponent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "salary_breakdown_id", nullable = false)
    private Long salaryBreakdownId;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false)
    private SalaryComponentType componentType;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "is_percentage")
    private Boolean isPercentage = false;

    @Column(name = "percentage_value", precision = 5, scale = 2)
    private BigDecimal percentageValue;

    @Column(name = "payroll_account_id")
    private Long payrollAccountId;
}

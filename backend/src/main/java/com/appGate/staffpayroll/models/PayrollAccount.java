package com.appGate.staffpayroll.models;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "payroll_accounts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PayrollAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false)
    private SalaryComponentType componentType;

    @Column(name = "account_gl_code", nullable = false)
    private String accountGlCode;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "description", length = 500)
    private String description;
}

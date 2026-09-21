package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "loan_percentage_setups")
@Data
@EqualsAndHashCode(callSuper = true)
public class LoanPercentageSetup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "setup_rate", precision = 10, scale = 2)
    private BigDecimal setupRate;

    @Column(name = "new_rate", precision = 10, scale = 2)
    private BigDecimal newRate;

    @Column(name = "income_gl_code")
    private String incomeGlCode;

    @Column(name = "loan_interest_type")
    private String loanInterestType; // SIMPLE, COMPOUND

    @Column(name = "is_active")
    private Boolean isActive = true;
}

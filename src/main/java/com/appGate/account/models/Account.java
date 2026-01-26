package com.appGate.account.models;

import com.appGate.account.enums.AccountType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
@Data
@EqualsAndHashCode(callSuper = true)
public class Account extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gl_code", unique = true, nullable = false)
    private String glCode; // e.g., "2021101"

    @Column(name = "account_name", nullable = false)
    private String accountName; // e.g., "Acc. Dep Computers"

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType; // ASSET, LIABILITY, INCOME, EXPENSE

    @Column(name = "class_id")
    private Integer classId; // 1=ASSET, 2=LIABILITY, 4=INCOME, 5=EXPENSE

    @Column(name = "is_control_account")
    private Boolean isControlAccount = false;

    @Column(name = "parent_account_id")
    private Long parentAccountId; // For sub-accounts

    @Column(name = "balance", precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;
}

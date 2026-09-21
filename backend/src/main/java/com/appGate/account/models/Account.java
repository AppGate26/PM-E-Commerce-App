package com.appGate.account.models;

import com.appGate.rbac.context.BranchOwned;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * A general-ledger account.
 *
 * <p>The chart of accounts is shared company-wide: an account with a null
 * {@code branchId} is visible to every branch. A non-null {@code branchId} marks
 * an account a single branch created for itself.
 *
 * <p>{@link #balance} is the company-wide balance and is meaningless to a branch
 * user — a branch's balance for an account is derived from its journal lines. See
 * {@code AccountingReportService.balancesByAccount}.
 */
@Entity
@Table(name = "accounts")
@Data
@EqualsAndHashCode(callSuper = true)
public class Account extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gl_code", unique = true, nullable = false)
    private String glCode; // e.g., "2021101"

    @Column(name = "account_name", nullable = false)
    private String accountName; // e.g., "Acc. Dep Computers"

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "account_type_id", nullable = false)
    private Long accountTypeId;

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

    @Column(name = "branch_id")
    private Long branchId;
}

package com.appGate.cashierstand.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * A cashier's running till total.
 *
 * <p>The uniqueness key includes the branch: the same named cashier working two
 * branches must not share one till, and without the branch column the second
 * branch's till would collide with the first's.
 */
@Entity
@Table(
        name = "cashier_till_balances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"cashier", "till_box", "branch_id"})
)
@Data
@EqualsAndHashCode(callSuper = true)
public class CashierTillBalance extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "cashier", nullable = false)
    private String cashier;

    @Column(name = "till_box", nullable = false)
    private String tillBox;

    @Column(name = "balance", precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;
}

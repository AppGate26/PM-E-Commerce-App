package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "wallets")
@Data
@EqualsAndHashCode(callSuper = true)
public class Wallet extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    /** The branch that opened this wallet — normally the customer's own branch. */
    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long userId;

    private Long customerId;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(nullable = false, length = 10)
    private String currency = "NGN";

    @Column(nullable = false)
    private Boolean isActive = true;

    private String accountNumber; // Virtual account number for wallet funding

    private String bankName; // Virtual bank name
}

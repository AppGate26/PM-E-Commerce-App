package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Tracks a pending Paystack bank-transfer wallet funding started by a cashier. It holds the
 * target walk-in customer (account number / customer id) so that when the Paystack payment
 * succeeds (verify or webhook), the correct customer wallet is credited. Kept separate from
 * {@code Payment} because a walk-in customer may not have a registered user id, which the
 * {@code payments} table requires.
 */
@Entity
@Table(name = "cashier_wallet_fundings")
@Data
@EqualsAndHashCode(callSuper = true)
public class CashierWalletFunding extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String paymentReference;

    private String accountNumber;

    private Long customerId;

    @Column(nullable = false)
    private Double amount;

    private String customerName;

    private String enteredBy;

    @Column(length = 500)
    private String description;

    private String method; // CARD or BANK_TRANSFER

    private Long companyCardId; // Set when method == CARD, so the auth code can be captured.

    @Column(nullable = false)
    private String status; // PENDING, COMPLETED, FAILED
}

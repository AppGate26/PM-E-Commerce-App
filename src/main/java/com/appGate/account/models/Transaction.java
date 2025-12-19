package com.appGate.account.models;

import com.appGate.account.enums.TransactionStatus;
import com.appGate.account.enums.TransactionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@EqualsAndHashCode(callSuper = true)
public class Transaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String transactionReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type; // CREDIT, DEBIT

    @Column(nullable = false)
    private Double amount;

    private Double balanceBefore;

    private Double balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status; // PENDING, COMPLETED, FAILED

    @Column(length = 500)
    private String description; // "Payment completed", "TF: ADENIJI", "Added", etc.

    @Column(length = 500)
    private String narration;

    @Column(nullable = false)
    private LocalDateTime transactionDate;

    // For transfers
    private Long recipientUserId;

    private String recipientAccountNumber;

    private String recipientBankName;
}

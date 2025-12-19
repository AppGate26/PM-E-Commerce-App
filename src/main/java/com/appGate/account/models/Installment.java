package com.appGate.account.models;

import com.appGate.account.enums.InstallmentStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Entity
@Table(name = "installments")
@Data
@EqualsAndHashCode(callSuper = true)
public class Installment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installment_plan_id", nullable = false)
    private InstallmentPlan installmentPlan;

    @Column(nullable = false)
    private Integer installmentNumber; // 1, 2, 3, etc.

    @Column(nullable = false)
    private Double amountDue;

    @Column(nullable = false)
    private Double amountPaid = 0.0;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallmentStatus status; // PENDING, PAID, OVERDUE, CANCELLED

    private Long paymentId; // Reference to Payment record

    @Column(nullable = false)
    private Integer daysOverdue = 0;
}

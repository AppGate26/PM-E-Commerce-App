package com.appGate.account.models;

import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.account.enums.InstallmentStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "installment_plans")
@Data
@EqualsAndHashCode(callSuper = true)
public class InstallmentPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Double totalAmount; // Product price

    @Column(nullable = false)
    private Double insuranceAmount; // 10% insurance

    @Column(nullable = false)
    private Double grandTotal; // totalAmount + insuranceAmount

    @Column(nullable = false)
    private Double downPayment; // Initial payment

    @Column(nullable = false)
    private Double remainingBalance;

    @Column(nullable = false)
    private Double installmentAmount; // Amount per installment

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallmentFrequency frequency; // DAILY, WEEKLY, MONTHLY

    @Column(nullable = false)
    private Integer numberOfInstallments; // How many payments

    @Column(nullable = false)
    private Integer completedInstallments = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallmentStatus status; // ACTIVE, COMPLETED, DEFAULTED, CANCELLED

    private LocalDate startDate;

    private LocalDate nextPaymentDate;

    private LocalDate completionDate;

    @Column(nullable = false)
    private Boolean earlyShipmentEligible = false; // After 2nd payment

    @OneToMany(mappedBy = "installmentPlan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Installment> installments = new ArrayList<>();
}

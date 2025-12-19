package com.appGate.account.models;

import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@EqualsAndHashCode(callSuper = true)
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Long orderId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod; // CARD, BANK_TRANSFER, WALLET, BANK

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status; // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

    @Column(unique = true)
    private String paymentReference; // Unique transaction reference

    private String gatewayReference; // Payment gateway reference (Paystack, Flutterwave)

    @Column(columnDefinition = "TEXT")
    private String gatewayResponse; // Full response from gateway (JSON)

    private LocalDateTime paidAt;

    private String failureReason;

    // For installment payments
    private Long installmentId; // If this payment is for an installment

    @Column(nullable = false)
    private Boolean isInstallmentPayment = false;
}

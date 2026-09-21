package com.appGate.account.models;

import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import com.appGate.rbac.context.BranchOwned;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@EqualsAndHashCode(callSuper = true)
public class Payment extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    // A mobile-app orderingsales.models.Order id - set by every mobile-side payment
    // path (OrderService, PaymentGatewayService, InstallmentService). Never a SalesOrder
    // id - see salesOrderId below for that.
    @Column(nullable = true)
    private Long orderId;

    // An orderingsales.models.SalesOrder id - set only by the admin-side installment
    // repayment flow (SalesService.verifyOrderInstallmentPayment). Kept separate from
    // orderId because the two ID spaces used to be conflated in that one column, which
    // made "find payments for this order" ambiguous depending on which side wrote the
    // row. New nullable column: no backfill of existing rows written before this field
    // existed - see the payments.order_id contamination check in the Stage 3 plan notes.
    @Column(nullable = true)
    private Long salesOrderId;

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

    // Set only for an installment plan's down payment, paid via
    // PaymentGatewayService.initializeDownPaymentBankTransfer BEFORE the plan has an
    // order attached - orderId above is null in that case since the order doesn't exist
    // yet. See PaymentGatewayService.markDownPaymentPaid and InstallmentPlan's matching
    // downPaymentPaid fields.
    private Long installmentPlanId;

    // How much of `amount` above is a delivery-fee quote folded into a pre-checkout
    // down payment charge (see PaymentGatewayService.initializeDownPaymentBankTransfer/
    // Card). Null/0 for every other payment type. Read by markDownPaymentPaid to stamp
    // InstallmentPlan.downPaymentDeliveryFee once the charge is confirmed.
    private Double deliveryFeeAmount;
}

package com.appGate.account.models;

import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.account.enums.InstallmentStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    // Null until the plan is confirmed at checkout - the plan is calculated and
    // persisted (POST /api/installments) before the order it will be attached to
    // exists, then OrderService.checkout() links the two once the order is saved.
    private Long orderId;

    // Set only for a plan shadowing a walk-in/online credit sale's LoanDetails (Phase 2
    // of the order/SalesOrder unification) - mirrors the same dual-ID pattern already
    // used by Payment.orderId/salesOrderId and OrderItem.order/salesOrderId. Exactly one
    // of orderId/salesOrderId is ever set, never both.
    //
    // A mobile-originated plan (orderId set) never gets this populated, even though every
    // mobile Order also has a mirrored SalesOrder (see MobileSalesOrderSyncService) - do
    // not "fix" that by setting both, it would break the exactly-one invariant above and
    // every write path that assumes it (see markShadowInstallmentPaid in SalesService,
    // which uses salesOrderId to find the shadow plan for a walk-in credit sale and must
    // stay a no-op for mobile orders - collecting payment against a mobile order's
    // SalesOrder mirror is refused outright, see the channel==MOBILE guards in
    // SalesService.initializeOrderInstallmentPayment/markAsPaid). To find a mobile order's
    // plan starting from its SalesOrder, join SalesOrder.mobileOrderId -> Order.id ->
    // InstallmentPlan.orderId instead (see SalesService.resolvePaymentProgress, which
    // already does exactly this - findByOrderId(salesOrder.getMobileOrderId())).
    private Long salesOrderId;

    @Column(nullable = false)
    private Long userId;

    // No longer set: a plan prices the caller's whole cart (see InstallmentService),
    // not a single product, so there is no one productId to stamp here.
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

    // The down payment is collected BEFORE this plan has an order attached (the mobile
    // checkout flow pays the down payment first, then calls OrderService.checkout() to
    // create the order - confirmed by production timestamps showing order creation
    // follows payment completion by about a second). These three fields are the
    // authoritative record of that, since there's no order yet at payment time to mark
    // paid the usual way. OrderService.checkout() reads them when it links this plan to
    // the new order, to immediately reflect the already-collected payment instead of
    // waiting for a payOrderByWallet-style call that never comes for this flow. See
    // PaymentGatewayService.initializeDownPaymentBankTransfer/markDownPaymentPaid.
    @Column(nullable = false)
    private Boolean downPaymentPaid = false;

    private LocalDateTime downPaymentPaidAt;

    private String downPaymentReference;

    // The delivery fee quoted for this plan's cart when the plan was built
    // (InstallmentService.buildPlan, from the delivery destination the caller supplied) -
    // 0/null when no destination was supplied or the order is PICKUP. It is deliberately
    // NOT part of totalAmount/grandTotal/installmentAmount: delivery is never financed
    // across the installments, it is charged in full as part of the first payment
    // (down payment), so firstPaymentAmount = downPayment + deliveryFee. Read by
    // PaymentGatewayService.resolveDownPaymentDeliveryFee as the authoritative fee to
    // fold into that charge, instead of having to recover a cached quote.
    private Double deliveryFee;

    // How much of the delivery fee, if any, was already collected as part of the
    // pre-checkout down payment charge above (see PaymentGatewayService.
    // initializeDownPaymentBankTransfer/Card, which can now fold a delivery-fee quote
    // into that charge). Null/0 means none was - the historical behaviour, where the
    // full order.getDeliveryFee() is still outstanding after down payment. Read by
    // resolveOrderChargeAmount/OrderService.payOrderByWallet so the later order-level
    // charge only collects what's left, instead of charging the delivery fee twice.
    private Double downPaymentDeliveryFee;

    // Excluded from equals/hashCode/toString: Installment carries a back-reference
    // to this plan, and Lombok's generated methods (unlike @JsonManagedReference/
    // @JsonBackReference, which only guard Jackson serialization) would otherwise
    // recurse across the bidirectional link and overflow the stack.
    @OneToMany(mappedBy = "installmentPlan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Installment> installments = new ArrayList<>();
}

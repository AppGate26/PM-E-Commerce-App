package com.appGate.orderingsales.models;

import com.appGate.orderingsales.enums.CustomerType;
import com.appGate.orderingsales.enums.FulfillmentType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.SalesChannel;
import com.appGate.orderingsales.enums.SalesOrderType;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SalesOrder extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Set only for a SalesOrder mirrored from a mobile-app checkout (see
    // MobileSalesOrderSyncService) - links this row back to orderingsales.models.Order#id
    // so mobile checkouts/part-payments can be kept in sync with this admin-facing model.
    // Null for orders created directly through the /api/sales endpoints.
    @Column(name = "mobile_order_id")
    private Long mobileOrderId;

    @Column(name = "reference_no", unique = true, nullable = false)
    private String referenceNo;

    // Backend-generated sales reference, minted on demand from the order-action
    // screens and persisted so it is stable and auditable.
    @Column(name = "sales_reference", unique = true)
    private String salesReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private SalesOrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", nullable = false)
    private CustomerType customerType;

    // Explicit origin discriminator (Phase 2 of the order/SalesOrder unification -
    // see SalesChannel). Nullable during the transition: backfilled for historical
    // rows by migration V1000.2, and newly-created rows should always set it, but
    // customerType/mobileOrderId remain the read-path source of truth until Phase 3
    // cuts readers over.
    @Enumerated(EnumType.STRING)
    @Column(name = "channel")
    private SalesChannel channel;

    // Whether the customer picks the order up or has it delivered - drives
    // SalesOrderRepository.findOrdersReadyForRiderAssignment so a pickup order never
    // shows up in Rider Box Management (see V13 migration).
    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_type", nullable = false)
    private FulfillmentType fulfillmentType = FulfillmentType.DELIVERY;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "customer_bank_account")
    private String customerBankAccount;

    // Product info
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "category")
    private String category;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "quantity")
    private Integer quantity = 1;

    @Column(name = "discount", precision = 15, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "coupon")
    private String coupon;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    // Order status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "payment_progress", precision = 5, scale = 2)
    private BigDecimal paymentProgress = BigDecimal.ZERO;

    @Column(name = "is_paid")
    private Boolean isPaid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Refund info
    @Column(name = "is_refunded")
    private Boolean isRefunded = false;

    @Column(name = "refund_amount", precision = 15, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    // Cancellation info
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    // Status to restore this order to if a pending cancellation request is rejected
    // by sales or admin - mirrors Order.preCancellationStatus for orders synced from
    // the mobile app. See SalesService.rejectCancellationRequest.
    @Enumerated(EnumType.STRING)
    @Column(name = "pre_cancellation_status")
    private OrderStatus preCancellationStatus;

    // Loan details reference
    @OneToOne(mappedBy = "salesOrder", cascade = CascadeType.ALL)
    @JsonManagedReference
    private LoanDetails loanDetails;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "branch_id")
    private Long branchId;
}

package com.appGate.orderingsales.models;

import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.PaymentType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "deliveryState", "deliveryLga", "deliveryWard"})
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false)
    private String orderNumber; // Format: ORD-XXXXXX

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "discount_amount")
    private Double discountAmount = 0.0;

    @Column(name = "delivery_fee")
    private Double deliveryFee = 0.0;

    @Column(name = "grand_total", nullable = false)
    private Double grandTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status")
    private DeliveryStatus deliveryStatus = DeliveryStatus.NOT_SHIPPED;

    @Column(name = "payment_reference")
    private String paymentReference; // Reference from payment gateway

    @Column(name = "installment_plan_id")
    private Long installmentPlanId; // If payment type is installment

    @Column(name = "is_paid")
    private Boolean isPaid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    // Delivery information
    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_state_id", referencedColumnName = "id")
    private com.appGate.rbac.models.State deliveryState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_lga_id", referencedColumnName = "id")
    private com.appGate.rbac.models.LGA deliveryLga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_ward_id", referencedColumnName = "id")
    private com.appGate.rbac.models.Ward deliveryWard;

    @Column(name = "delivery_country")
    private String deliveryCountry = "Nigeria";

    @Column(name = "delivery_postal_code")
    private String deliveryPostalCode;

    @Column(name = "delivery_phone")
    private String deliveryPhone;

    @Column(name = "delivery_notes", length = 1000)
    private String deliveryNotes;

    @Column(name = "rider_id")
    private Long riderId; // Assigned rider

    @Column(name = "tracking_number")
    private String trackingNumber;

    // Order items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @Column(name = "notes", length = 1000)
    private String notes; // Customer notes

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;
}

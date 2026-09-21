package com.appGate.orderingsales.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable as of migration V1000.3 (Phase 2 of the order/SalesOrder unification):
    // an OrderItem for a walk-in/online SalesOrder has no mobile Order to hang off, so
    // exactly one of order/salesOrderId is set, never both. See salesOrderId below.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private Order order;

    // Set only for an OrderItem created directly against a SalesOrder (walk-in/online
    // sale, not mirrored from the mobile app) - mirrors the same dual-ID pattern already
    // used by Payment.orderId/salesOrderId, for the same reason: the two "order" tables
    // aren't unified yet, so a plain FK can't point at either interchangeably.
    @Column(name = "sales_order_id")
    private Long salesOrderId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_image")
    private String productImage;

    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "subtotal", nullable = false)
    private Double subtotal; // unitPrice * quantity

    @Column(name = "discount")
    private Double discount = 0.0;

    @Column(name = "total", nullable = false)
    private Double total; // subtotal - discount
}

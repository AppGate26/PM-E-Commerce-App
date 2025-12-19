package com.appGate.delivery.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "delivery_notifications")
public class DeliveryNotification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "rider_id")
    private Long riderId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "notification_type")
    private String notificationType; // ORDER_ASSIGNED, IN_TRANSIT, DELIVERED, FAILED

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "notification_date")
    private LocalDateTime notificationDate;
}

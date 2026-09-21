package com.appGate.orderingsales.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(
        name = "order_notification_seen",
        uniqueConstraints = @UniqueConstraint(columnNames = "user_id")
)
@Data
@EqualsAndHashCode(callSuper = true)
public class OrderNotificationSeen extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "order_list")
    private Integer orderList = 0;

    @Column(name = "cancelled")
    private Integer cancelled = 0;

    @Column(name = "refund")
    private Integer refund = 0;
}

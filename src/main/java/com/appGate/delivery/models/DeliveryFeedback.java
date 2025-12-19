package com.appGate.delivery.models;

import com.appGate.delivery.enums.FeedbackStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "delivery_feedbacks")
public class DeliveryFeedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_box_id", nullable = false)
    private Long riderBoxId;

    @Column(name = "delivery_confirmation_id")
    private Long deliveryConfirmationId;

    @Column(name = "delivery_agent_name")
    private String deliveryAgentName;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "customer_name")
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FeedbackStatus status;
}

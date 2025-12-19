package com.appGate.delivery.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "delivery_confirmations")
public class DeliveryConfirmation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_box_id", nullable = false)
    private Long riderBoxId;

    @Column(name = "delivery_agent_name")
    private String deliveryAgentName;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "item_of_delivery")
    private String itemOfDelivery;

    @Column(name = "proof_of_delivery_image")
    private String proofOfDeliveryImage;

    @Column(name = "time_of_delivery")
    private LocalDateTime timeOfDelivery;
}

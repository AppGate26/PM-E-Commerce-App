package com.appGate.delivery.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "rider_feedbacks")
public class RiderFeedbackEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rider_id", nullable = false)
    private Long riderId;

    @Column(name = "rider_name")
    private String riderName;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "delivery_rating")
    private Integer deliveryRating; // 1-5 stars

    @Column(name = "customer_feedback", length = 1000)
    private String customerFeedback;

    @Column(name = "issues_encountered", length = 1000)
    private String issuesEncountered;

    @Column(name = "suggestions", length = 1000)
    private String suggestions;

    @Column(name = "feedback_type")
    private String feedbackType; // POSITIVE, NEGATIVE, NEUTRAL
}

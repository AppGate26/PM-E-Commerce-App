package com.appGate.inventory.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "advance_payment_plans")
public class AdvancePaymentPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName; // e.g., "7 days", "15 days", "30 days", "60 days", "PAY AS BUY", "ADO"

    @Column(name = "percentage_payment_made")
    private Integer percentagePaymentMade;

    @Column(name = "timeline_of_deliverables", length = 500)
    private String timelineOfDeliverables;

    @Column(name = "payment_milestones", length = 1000)
    private String paymentMilestones; // JSON or text describing payment stages

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "description", length = 1000)
    private String description;
}

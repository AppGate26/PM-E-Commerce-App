package com.appGate.customercare.models;

import com.appGate.customercare.enums.EscalationStatus;
import com.appGate.customercare.enums.EscalationTarget;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "care_escalations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Escalation extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target")
    private EscalationTarget target;

    // Set when target = DEPARTMENT (e.g. "Accounting", "Inventory").
    @Column(name = "department")
    private String department;

    // Set when target = EMAIL.
    @Column(name = "email")
    private String email;

    @Column(name = "priority")
    private String priority;

    @Column(name = "subject")
    private String subject;

    @Column(name = "details", length = 4000)
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EscalationStatus status = EscalationStatus.OPEN;

    // Identifier (name/email/id) of the care agent who raised the escalation.
    @Column(name = "raised_by")
    private String raisedBy;
}

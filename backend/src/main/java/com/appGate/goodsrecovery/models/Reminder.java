package com.appGate.goodsrecovery.models;

import com.appGate.goodsrecovery.enums.RecipientType;
import com.appGate.goodsrecovery.enums.RelatedEntityType;
import com.appGate.goodsrecovery.enums.ReminderType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "reminders")
public class Reminder extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    /** The branch that raised the reminder. */
    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false)
    private RecipientType recipientType;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_email")
    private String recipientEmail;

    @Column(name = "recipient_phone")
    private String recipientPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false)
    private ReminderType reminderType;

    @Column(name = "message", length = 1000, nullable = false)
    private String message;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDateTime scheduledDate;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "is_sent", nullable = false)
    private Boolean isSent = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_entity_type")
    private RelatedEntityType relatedEntityType;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "notes", length = 500)
    private String notes;
}

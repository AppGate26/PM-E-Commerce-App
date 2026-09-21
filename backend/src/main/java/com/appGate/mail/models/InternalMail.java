package com.appGate.mail.models;

import com.appGate.rbac.models.BaseEntity;
import com.appGate.rbac.models.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "internal_mails")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InternalMail extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"password", "resetOtp", "hibernateLazyInitializer", "handler"})
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"password", "resetOtp", "hibernateLazyInitializer", "handler"})
    private User recipient;

    @Column(name = "subject")
    private String subject;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "is_deleted_by_sender")
    private Boolean isDeletedBySender = false;

    @Column(name = "is_deleted_by_recipient")
    private Boolean isDeletedByRecipient = false;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}

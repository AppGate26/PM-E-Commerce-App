package com.appGate.goodsrecovery.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "loan_notifications")
public class LoanNotification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "loan_amount")
    private BigDecimal loanAmount;

    @Column(name = "amount_due")
    private BigDecimal amountDue;

    @Column(name = "payment_due_date")
    private LocalDateTime paymentDueDate;

    @Column(name = "notification_type")
    private String notificationType; // PAYMENT_DUE, PAYMENT_OVERDUE, FINAL_WARNING, DEFAULT

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "is_sent")
    private Boolean isSent = false;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "notification_date")
    private LocalDateTime notificationDate;
}

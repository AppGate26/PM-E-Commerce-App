package com.appGate.inventory.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@Table(name = "payment_terms")
public class PaymentTerm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "invoice_amount", precision = 15, scale = 2)
    private BigDecimal invoiceAmount;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "period_of_payment")
    private String periodOfPayment; // e.g., "30 days", "NET 15", "NET 30"

    @Column(name = "rules_for_payment", length = 1000)
    private String rulesForPayment;

    @Column(name = "advance_payment_details", length = 500)
    private String advancePaymentDetails;

    @Column(name = "percentage_made")
    private Integer percentageMade; // Percentage paid upfront

    @Column(name = "tenure_of_delivery")
    private String tenureOfDelivery;

    @Column(name = "process_incase_of_nondelivery", length = 1000)
    private String processIncaseOfNondelivery;

    @Column(name = "timeline_of_delivery")
    private String timelineOfDelivery;

    @Column(name = "accepted_payment_methods", length = 500)
    private String acceptedPaymentMethods; // e.g., "CASH, BANK TRANSFER"

    @Column(name = "discount_on_order")
    private BigDecimal discountOnOrder;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "is_b2b")
    private Boolean isB2B = true; // Business to business transaction
}

package com.appGate.orderingsales.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class LoanDetails extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @Column(name = "loan_type")
    private String loanType; // LONG TERM, SHORT TERM

    @Column(name = "product_amount", precision = 15, scale = 2)
    private BigDecimal productAmount;

    @Column(name = "repayment_method")
    private String repaymentMethod; // MONTHLY, WEEKLY, BI-WEEKLY

    @Column(name = "duration")
    private String duration; // e.g., "5M", "12M"

    @Column(name = "rate", precision = 5, scale = 2)
    private BigDecimal rate;

    @Column(name = "interest_on_loan", precision = 15, scale = 2)
    private BigDecimal interestOnLoan;

    @Column(name = "principal_repayment", precision = 15, scale = 2)
    private BigDecimal principalRepayment;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "officer_in_charge")
    private String officerInCharge;

    @Column(name = "upfront_charges", precision = 15, scale = 2)
    private BigDecimal upfrontCharges;

    @Column(name = "total_repayment", precision = 15, scale = 2)
    private BigDecimal totalRepayment;
}

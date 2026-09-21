package com.appGate.orderingsales.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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
    @JsonBackReference
    private SalesOrder salesOrder;

    // Customer-account linkage so the loan shows "on the customer account". Walk-in
    // customers are identified by account number throughout the app.
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "customer_name")
    private String customerName;

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

    @OneToMany(mappedBy = "loanDetails", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<LoanRepaymentEntry> repaymentEntries = new ArrayList<>();
}

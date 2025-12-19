package com.appGate.cashierstand.models;

import com.appGate.cashierstand.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cash_payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CashPayment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_number", unique = true)
    private String referenceNumber;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "address")
    private String address;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "total_balance", precision = 15, scale = 2)
    private BigDecimal totalBalance;

    @Column(name = "entered_by")
    private String enteredBy;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    @OneToMany(mappedBy = "cashPayment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CashPaymentItem> items = new ArrayList<>();
}

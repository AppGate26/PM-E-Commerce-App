package com.appGate.inventory.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@Table(name = "supplier_payments")
public class SupplierPayment extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(name = "amount_paid", precision = 15, scale = 2, nullable = false)
    private BigDecimal amountPaid;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "payment_method")
    private String paymentMethod; // CASH, BANK_TRANSFER, CHEQUE, etc.

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "invoice_number")
    private String invoiceNumber; // the goods-supplied invoice this payment is settling, if any

    @Column(name = "notes")
    private String notes;
}

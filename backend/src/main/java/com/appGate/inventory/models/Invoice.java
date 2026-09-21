package com.appGate.inventory.models;

import com.appGate.inventory.enums.InvoiceStatus;
import com.appGate.inventory.enums.InvoiceType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "invoices")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Invoice extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false)
    private InvoiceType invoiceType; // INVOICE or PROFORMA

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_address", length = 500)
    private String customerAddress;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "subtotal", precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax", precision = 15, scale = 2)
    private BigDecimal tax;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "amount_due", precision = 15, scale = 2)
    private BigDecimal amountDue;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "company_address", length = 500)
    private String companyAddress;

    @Column(name = "company_phone")
    private String companyPhone;

    @Column(name = "company_email")
    private String companyEmail;

    @Column(name = "discount", precision = 15, scale = 2)
    private BigDecimal discount;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_name")
    private String accountName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "branch_id")
    private Long branchId;

    @PostPersist
    public void generateInvoiceNumber() {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            String year = String.valueOf(Year.now().getValue()).substring(2);
            String formattedId = String.format("%06d", id);
            invoiceNumber = "INV/" + year + "/" + formattedId;
        }
    }
}

// generating an invoice is same as payment terms
// generating a proforma is getting the invoices, (let there be an endpoint that
// gets all invoices)

// upload opening stock from excel

package com.appGate.inventory.dto;

import com.appGate.inventory.enums.InvoiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateInvoiceDto {

    @NotNull(message = "Invoice type is required")
    private InvoiceType invoiceType; // INVOICE or PROFORMA

    private Long supplierId;

    private String supplierName;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerAddress;

    private String customerPhone;

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;

    private LocalDate dueDate;

    private LocalDate deliveryDate;

    @NotEmpty(message = "At least one invoice item is required")
    @Valid
    private List<InvoiceItemDto> items;

    private BigDecimal tax;

    private String notes;

    private String companyName;

    private String companyAddress;

    private String companyPhone;

    private String companyEmail;

    private BigDecimal discount;

    private String bankName;

    private String accountName;

    private String accountNumber;

    // null = central/HQ invoice; set to a branchId for branch-originated invoices
    private Long branchId;
}

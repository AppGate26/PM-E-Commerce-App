package com.appGate.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ProformaInvoiceDto {

    // Company details
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;

    // Proforma details
    private String proformaNumber;
    private LocalDate date;

    // Customer details
    private String customerName;
    private String customerPhone;
    private String customerAddress;

    // Line items
    private List<ProformaItemDto> items;

    // Totals
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal totalAmount;

    // Bank details
    private String bankName;
    private String accountName;
    private String accountNumber;

    // Terms & Conditions
    private List<String> termsAndConditions;

    // Source invoice reference
    private String invoiceNumber;

    @Data
    @Builder
    public static class ProformaItemDto {
        private Integer serialNumber;
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal total;
    }
}

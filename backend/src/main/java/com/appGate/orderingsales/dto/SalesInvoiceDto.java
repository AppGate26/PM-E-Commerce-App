package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// Printable invoice/receipt for an approved sale, laid out after the APPGATE_Invoice
// template (letterhead, bill-to + meta block, item table, total, amount in words, payment
// details, notes). Built by SalesInvoiceService; the web and mobile clients only render it.
// documentType is RECEIPT once nothing is owed, INVOICE while a balance remains.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoiceDto {
    private String documentType;
    private String documentNo;
    private LocalDateTime issuedAt;
    private LocalDateTime saleDate;
    private LocalDate nextDueDate;
    private String currency;

    private String saleType;
    private String orderStatus;
    private String paymentStatus;
    private String paymentMethod;
    private List<String> orderReferences;

    private Company company;
    private Customer customer;
    private List<Line> items;
    private List<Charge> charges;

    private BigDecimal subtotal;
    private BigDecimal total;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private String amountInWords;

    private List<RepaymentEntryDetailDto> payments;
    private List<String> notes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Company {
        private String name;
        private String tagline;
        private String bankName;
        private String accountName;
        private String accountNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Customer {
        private String name;
        private String accountNumber;
        private String phone;
        private String email;
        private String address;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Line {
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal amount;
    }

    // Anything payable on top of the item lines (delivery, insurance, VAT, credit
    // interest) - or below them, for an order-level discount (negative amount).
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Charge {
        private String label;
        private BigDecimal amount;
    }
}

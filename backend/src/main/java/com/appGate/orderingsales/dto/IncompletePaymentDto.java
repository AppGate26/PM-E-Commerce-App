package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncompletePaymentDto {
    private Long orderId;
    private String referenceNo;
    private String customerName;
    private String accountNumber;
    private String productName;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal paymentPercentage;
    // Mobile one-off orders are mirrored in already settled while staff-entered ones arrive
    // unpaid, so the "One of order" screen has to know which it is holding: settleOneOffOrder
    // rejects an order that is already paid.
    private Boolean isPaid;
    private String salesReference;
    private String orderType;
    private String customerType;
    private String status;
    private Integer totalInstallments;
    private Integer paidInstallments;
    private LocalDate nextDueDate;
}

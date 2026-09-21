package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompletedPaymentDto {
    private Long orderId;
    private String referenceNo;
    private String customerName;
    private String accountNumber;
    private String productName;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    // The reference whose existence is what puts the order on this screen at all
    // (SalesService.generateSalesReference) - worth showing rather than leaving implicit.
    private String salesReference;
    // Stored paymentProgress, not a recomputed figure: the screen lists orders by reference,
    // not by being paid in full, so it has to state each order's actual percentage instead of
    // labelling every row 100%.
    private BigDecimal paymentPercentage;
    // Null until the order is actually settled - a referenced order need not be paid yet.
    private LocalDateTime paidAt;
    private String orderType;
    private String customerType;
    private String deliveryStatus;
}

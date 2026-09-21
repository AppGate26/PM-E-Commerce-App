package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDetailDto {
    private Long orderId;
    private String referenceNo;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal totalPaid;
    private BigDecimal paymentPercentage;
    private BigDecimal outstandingBalance;
    private Integer totalRecords;
    private Integer paidRecords;
    private Integer pendingRecords;
    private Integer overdueRecords;
    private List<RepaymentEntryDetailDto> payments;
}

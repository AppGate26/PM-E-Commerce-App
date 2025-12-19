package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefundDto {
    private String customerName;
    private String customerAccountNo;
    private String productReference;
    private BigDecimal amountToRefund;
}

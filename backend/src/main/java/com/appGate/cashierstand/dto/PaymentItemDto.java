package com.appGate.cashierstand.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentItemDto {
    private String productName;
    private String description;
    private String category;
    private BigDecimal unitPrice;
    private Integer quantity;
}

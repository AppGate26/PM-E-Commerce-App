package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One cart line's worth of information needed to price its delivery. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryLineItemDto {
    private Long categoryId;
    private String categoryName;
    private BigDecimal unitWeightKg;
    private Integer quantity;
}

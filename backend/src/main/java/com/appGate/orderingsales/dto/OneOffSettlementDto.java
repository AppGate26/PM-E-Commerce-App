package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OneOffSettlementDto {
    private BigDecimal insurance;
    private BigDecimal deliveryCharges;
    private BigDecimal vat;
}

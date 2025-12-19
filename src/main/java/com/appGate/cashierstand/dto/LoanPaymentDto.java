package com.appGate.cashierstand.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanPaymentDto {
    private String accountNumber;
    private BigDecimal amountToPay;
    private String paymentMode;
    private String enteredBy;
    private String description;
}

package com.appGate.cashierstand.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CashPaymentDto {
    private String referenceNumber;
    private String address;
    private String phoneNumber;
    private String customerName;
    private List<PaymentItemDto> products;
    private String paymentMethod;
    private String enteredBy;
    private BigDecimal totalBalance;
}

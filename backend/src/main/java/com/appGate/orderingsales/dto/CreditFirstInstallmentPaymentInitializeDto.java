package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Request body for POST /api/sales/credit/first-installment/initialize-payment. The
// credit-sale form has not been submitted yet at this point (no SalesOrder/LoanDetails
// exist), so the whole draft rides through Paystack's metadata (see SalesService) the
// same way a walk-in cash cart does, and is turned into a CREDIT_SALES approval request
// once the first installment is confirmed paid.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreditFirstInstallmentPaymentInitializeDto {
    private SalesOrderDto saleData;
    private Double firstInstallmentAmount;
    private String email;
    private String callbackUrl;
    private Long requestedBy;
    private String comments;
}

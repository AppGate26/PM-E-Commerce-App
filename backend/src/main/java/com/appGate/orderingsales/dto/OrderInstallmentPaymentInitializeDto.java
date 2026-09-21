package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Request body for POST /api/sales/orders/{orderId}/installment-payment/initialize. The
// order already exists and already has LoanDetails/LoanRepaymentEntry rows - the amount
// is never taken from this DTO, it is always priced server-side from the order's next
// PENDING/OVERDUE repayment entry (see SalesService.initializeOrderInstallmentPayment).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderInstallmentPaymentInitializeDto {
    private String email;
    private String callbackUrl;
}

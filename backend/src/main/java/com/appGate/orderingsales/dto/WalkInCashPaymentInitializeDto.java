package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// Request body for POST /api/sales/walk-in/cash/initialize-payment. "items" is exactly
// the per-line-item shape the Cash Sales frontend already builds for the manual
// (admin-approval) walk-in cash flow.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalkInCashPaymentInitializeDto {
    private List<SalesOrderDto> items;
    private Double amount;
    private String email;
    private String customerName;
    private String callbackUrl;
}

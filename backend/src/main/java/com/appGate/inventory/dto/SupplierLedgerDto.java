package com.appGate.inventory.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SupplierLedgerDto {
    private Long supplierId;
    private LocalDate transactionDate;
    private String description;
    private String referenceNo;
    private String transactionType;
    private BigDecimal debit;
    private BigDecimal credit;
}

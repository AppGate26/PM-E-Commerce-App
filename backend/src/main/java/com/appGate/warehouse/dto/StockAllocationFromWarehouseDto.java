package com.appGate.warehouse.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class StockAllocationFromWarehouseDto {
    private Long warehouseId;
    private Long productId;
    private Long branchId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private Integer stockIncrement;
    private String accountToDebit;
    private String accountToCredit;
}

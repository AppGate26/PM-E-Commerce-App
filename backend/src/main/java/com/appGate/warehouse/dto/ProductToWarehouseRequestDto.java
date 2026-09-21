package com.appGate.warehouse.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductToWarehouseRequestDto {
    private Long productId;
    private Long destinationWarehouseId;
    private Long sourceWarehouseId; // Optional, for warehouse-to-warehouse transfers
    private Integer quantity;
    private String operationType; // TRANSFER, ADD_TO_WAREHOUSE, WAREHOUSE_TRANSFER, etc.
    private String reason;
    private Long requestedBy;
    private String referenceNumber;
    private BigDecimal unitPrice;
    private String notes;
}

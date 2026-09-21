package com.appGate.warehouse.dto;

import com.appGate.warehouse.enums.ProductCondition;
import com.appGate.warehouse.enums.SourceType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductReceiptDto {
    private Long warehouseId;
    private Long productId;
    private Integer quantityReceived;
    private SourceType sourceType;
    private LocalDate receivedDate;
    private Long receivedBy;
    private BigDecimal costPrice;
    private ProductCondition condition;
    private Long supplierId;
}

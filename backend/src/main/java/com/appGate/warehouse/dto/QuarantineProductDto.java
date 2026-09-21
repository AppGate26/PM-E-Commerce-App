package com.appGate.warehouse.dto;

import lombok.Data;

@Data
public class QuarantineProductDto {
    private Long warehouseId;
    private Long receiverWarehouseId;
    private Long productId;
    private Long branchId;
    private Integer quantity;
}

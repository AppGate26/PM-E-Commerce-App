package com.appGate.warehouse.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductSwapDto {
    private Long senderWarehouseId;
    private Long receiverWarehouseId;
    private Long productId;
    private Long branchId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String accountToDebit;
    private String accountToCredit;
}

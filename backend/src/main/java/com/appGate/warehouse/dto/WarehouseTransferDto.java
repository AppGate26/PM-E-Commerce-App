package com.appGate.warehouse.dto;

import lombok.Data;

@Data
public class WarehouseTransferDto {
    private Long senderWarehouseId;
    private Long receiverWarehouseId;
    private Long productId;
    private Integer quantity;
    private String accountToDebit;
    private String accountToCredit;
}

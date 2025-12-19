package com.appGate.goodsrecovery.dto;

import lombok.Data;

@Data
public class RecoveryItemDto {
    private Long productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private String description;
    private String recoveryStatus;
    private String recoveryPhoto;
}

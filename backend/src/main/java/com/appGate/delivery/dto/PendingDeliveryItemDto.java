package com.appGate.delivery.dto;

import lombok.Data;

@Data
public class PendingDeliveryItemDto {
    private Long productId;
    private String productName;
    private String productImage;
    private Integer quantity;
    private Double unitPrice;
    private Double subtotal;
}

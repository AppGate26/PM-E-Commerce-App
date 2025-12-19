package com.appGate.delivery.dto;

import lombok.Data;

@Data
public class PendingDeliveryDto {
    private Long riderBoxId;
    private Long orderId;
    private Long saleRef;
    private String productName;
    private String productImage;
    private String deliveryAddress;
    private String customerName;
    private String customerPhone;
    private String estimatedTime;
    private String status;
}

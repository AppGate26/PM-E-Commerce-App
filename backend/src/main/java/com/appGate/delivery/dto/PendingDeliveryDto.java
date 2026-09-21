package com.appGate.delivery.dto;

import lombok.Data;

import java.util.List;

@Data
public class PendingDeliveryDto {
    private Long riderBoxId;
    private Long orderId;
    private Long saleRef;
    // Kept for older mobile builds that only render a single product per delivery -
    // mirrors items.get(0). New clients should read `items` instead, since an order
    // can hold more than one product (see DeliveryOperationsService.mapToPendingDeliveryDto).
    private String productName;
    private String productImage;
    private List<PendingDeliveryItemDto> items;
    private String deliveryAddress;
    private String customerName;
    private String customerPhone;
    private String estimatedTime;
    private String status;
}

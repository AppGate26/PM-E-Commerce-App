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
    // Mirrors items.get(0).productId so the rider app can auto-fill the feedback form's
    // product id instead of the rider typing it in.
    private Long productId;
    private String productCategory;
    // SalesOrder.referenceNo - shown as "Sales Ref" on the rider's delivery details screen.
    private String salesReference;
    private String riderName;
    private List<PendingDeliveryItemDto> items;
    private String deliveryAddress;
    private String customerName;
    private String customerPhone;
    private String estimatedTime;
    private String status;
}

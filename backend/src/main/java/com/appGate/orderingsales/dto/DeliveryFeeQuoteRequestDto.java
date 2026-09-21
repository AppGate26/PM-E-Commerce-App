package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.FulfillmentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request for a delivery-fee quote against the caller's current cart, without
 * creating an order. Shared by the web checkout page and the mobile app.
 */
@Data
public class DeliveryFeeQuoteRequestDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    // Defaults to DELIVERY when omitted. When PICKUP, OrderService.calculateDeliveryFeeQuote()
    // skips the address/state/LGA requirement below and returns a zero delivery fee
    // without calling the distance service.
    private FulfillmentType fulfillmentType;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String deliveryAddress;

    private Long deliveryStateId;

    private Long deliveryLgaId;

    private Long deliveryWardId;

    private String deliveryCountry = "Nigeria";
}

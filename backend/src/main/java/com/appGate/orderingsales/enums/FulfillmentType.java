package com.appGate.orderingsales.enums;

public enum FulfillmentType {
    DELIVERY, // Shipped to deliveryAddress; delivery fee computed from distance
    PICKUP    // Collected by the customer at the fulfilling branch; no delivery fee, no address/distance lookup
}

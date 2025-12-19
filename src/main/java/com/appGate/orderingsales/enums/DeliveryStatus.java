package com.appGate.orderingsales.enums;

public enum DeliveryStatus {
    NOT_SHIPPED,          // Order not yet shipped
    AWAITING_PICKUP,      // Ready for rider pickup
    PICKED_UP,            // Rider has picked up the order
    IN_TRANSIT,           // Order is being delivered
    DELIVERED,            // Successfully delivered
    FAILED_DELIVERY,      // Delivery attempt failed
    RETURNED              // Order was returned
}

package com.appGate.orderingsales.enums;

public enum OrderStatus {
    PENDING,              // Order created, awaiting payment
    PAYMENT_CONFIRMED,    // Payment received and confirmed
    PROCESSING,           // Order is being prepared
    SHIPPED,              // Order has been shipped
    IN_TRANSIT,           // Order is on the way
    DELIVERED,            // Order has been delivered
    CANCELLED,            // Order was cancelled
    REFUNDED,             // Payment was refunded
    FAILED                // Order failed
}

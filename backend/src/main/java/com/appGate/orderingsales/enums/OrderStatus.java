package com.appGate.orderingsales.enums;

public enum OrderStatus {
    PENDING,              // Order created, awaiting payment
    PAYMENT_CONFIRMED,    // Payment received and confirmed
    APPROVED,             // Reviewed and forwarded by sales, awaiting admin approval
    PROCESSING,           // Order is being prepared
    ASSIGNED_TO_RIDER,    // Handed to a rider for delivery (see RiderBoxService.assignProduct)
    SHIPPED,              // Order has been shipped
    IN_TRANSIT,           // Order is on the way
    DELIVERED,            // Order has been delivered
    CANCELLATION_REQUESTED,        // Customer asked to cancel; awaiting sales review
    PENDING_CANCELLATION_APPROVAL, // Sales forwarded the cancellation request; awaiting admin decision
    CANCELLED,            // Order was cancelled
    REFUNDED,             // Payment was refunded
    FAILED                // Order failed
}

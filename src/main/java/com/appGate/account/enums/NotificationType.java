package com.appGate.account.enums;

public enum NotificationType {
    ORDER_CREATED,           // Order created successfully
    ORDER_CONFIRMED,         // Payment confirmed
    ORDER_PROCESSING,        // Order is being processed
    ORDER_SHIPPED,           // Order has been shipped
    ORDER_DELIVERED,         // Order delivered
    ORDER_CANCELLED,         // Order cancelled
    PAYMENT_SUCCESS,         // Payment successful
    PAYMENT_FAILED,          // Payment failed
    INSTALLMENT_DUE,         // Installment payment due
    INSTALLMENT_OVERDUE,     // Installment payment overdue
    INSTALLMENT_PAID,        // Installment paid
    WALLET_CREDITED,         // Money added to wallet
    WALLET_DEBITED,          // Money deducted from wallet
    TRANSFER_RECEIVED,       // Money received from transfer
    TRANSFER_SENT,           // Money sent via transfer
    PRODUCT_REVIEW,          // Product review notification
    SYSTEM_ALERT,            // System alerts
    PROMOTIONAL              // Promotional notifications
}

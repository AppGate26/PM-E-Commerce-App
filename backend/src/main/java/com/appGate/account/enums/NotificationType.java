package com.appGate.account.enums;

public enum NotificationType {
    // Order notifications
    ORDER_CREATED,           // Order created successfully
    ORDER_CONFIRMED,         // Payment confirmed
    ORDER_PROCESSING,        // Order is being processed
    ORDER_SHIPPED,           // Order has been shipped
    ORDER_DELIVERED,         // Order delivered
    ORDER_CANCELLED,         // Order cancelled

    // Payment notifications
    PAYMENT_SUCCESS,         // Payment successful
    PAYMENT_FAILED,          // Payment failed

    // Installment notifications
    INSTALLMENT_DUE,         // Installment payment due
    INSTALLMENT_OVERDUE,     // Installment payment overdue
    INSTALLMENT_PAID,        // Installment paid

    // Wallet notifications
    WALLET_CREDITED,         // Money added to wallet
    WALLET_DEBITED,          // Money deducted from wallet

    // Transfer notifications
    TRANSFER_RECEIVED,       // Money received from transfer
    TRANSFER_SENT,           // Money sent via transfer

    // Product notifications
    PRODUCT_REVIEW,          // Product review notification

    // Care module notifications
    INCOMING_CALL,           // New incoming call
    CALL_QUEUE_UPDATE,       // Queue status changed
    CALL_ACCEPTED,           // Call accepted by agent
    CALL_DECLINED,           // Call declined
    CALL_ENDED,              // Call ended
    CHAT_MESSAGE,            // New chat message
    CHAT_STARTED,            // Chat conversation started
    ESCALATION,              // Issue escalated to department
    SUPPORT_RESOLVED,        // Support ticket resolved

    // System notifications
    SYSTEM_ALERT,            // System alerts
    PROMOTIONAL              // Promotional notifications
}

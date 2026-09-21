package com.appGate.orderingsales.enums;

public enum ReturnStatus {
    PENDING,     // Return request submitted, awaiting admin review
    APPROVED,    // Admin approved the return
    REJECTED,    // Admin rejected the return
    PROCESSING,  // Return is being processed (pickup scheduled or item in transit back)
    COMPLETED,   // Return and replacement/refund fully resolved
    RESTORED     // Returned item has been repaired/restored and logged
}

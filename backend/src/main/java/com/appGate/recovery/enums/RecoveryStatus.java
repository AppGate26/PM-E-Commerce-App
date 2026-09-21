package com.appGate.recovery.enums;

public enum RecoveryStatus {
    PENDING,      // Recovery request initiated
    SENT,         // Email/SMS sent
    VERIFIED,     // Token/code verified
    COMPLETED,    // Recovery completed
    EXPIRED,      // Token/code expired
    FAILED        // Recovery failed
}

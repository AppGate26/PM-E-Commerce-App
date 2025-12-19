package com.appGate.account.enums;

public enum VerificationStatus {
    PENDING,       // Verification initiated
    IN_PROGRESS,   // Verification in progress
    VERIFIED,      // Successfully verified
    FAILED,        // Verification failed
    EXPIRED        // Verification link/session expired
}

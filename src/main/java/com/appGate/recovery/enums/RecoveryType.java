package com.appGate.recovery.enums;

public enum RecoveryType {
    PASSWORD_RESET,       // Reset forgotten password
    ACCOUNT_RECOVERY,     // Recover locked account
    TWO_FACTOR_RESET,     // Reset 2FA
    EMAIL_VERIFICATION,   // Email verification/change
    PHONE_VERIFICATION    // Phone verification/change
}

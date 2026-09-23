package com.appGate.account.enums;

/**
 * The role an Account Details GL plays in automatic postings. Each branch may
 * tag at most one GL per purpose; {@code GlPostingService} looks accounts up by
 * (branch, purpose) when a Paystack or wallet payment succeeds.
 */
public enum GlPurpose {
    /** Paystack receipts collected for the branch. */
    PAYSTACK,
    /** Sales income for products belonging to the branch. */
    SALES_REVENUE,
    /** Customer wallet balances; Head Office only. */
    CUSTOMER_WALLET
}

package com.appGate.orderingsales.enums;

// Explicit origin discriminator for a SalesOrder - Phase 2 of the order/SalesOrder
// unification plan (docs/flyway migration V1000.2). Replaces the implicit
// "mobileOrderId != null" check used elsewhere as the mobile/non-mobile signal, and
// splits CustomerType.ONLINE (which today conflates the web storefront and the mobile
// app) into its two real origins.
public enum SalesChannel {
    MOBILE,     // Mirrored from orderingsales.models.Order via MobileSalesOrderSyncService
    ONLINE,     // Created directly through /api/sales/online/* (web storefront)
    WALKIN      // Created directly through /api/sales/walk-in/* (POS/admin)
}

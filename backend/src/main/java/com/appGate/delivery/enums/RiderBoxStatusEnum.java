package com.appGate.delivery.enums;

public enum RiderBoxStatusEnum {
    PENDING,
    ACCEPTED,
    // Rider tapped "Start delivery" in the app and is on the way - see
    // DeliveryOperationsService.startDelivery. Stored as VARCHAR (see
    // VarcharEnumMariaDBDialect), so no migration is needed for this value.
    IN_TRANSIT,
    REJECTED,
    DELIVERED

}

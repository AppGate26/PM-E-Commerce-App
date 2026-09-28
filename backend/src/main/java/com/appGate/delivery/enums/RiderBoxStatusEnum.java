package com.appGate.delivery.enums;

public enum RiderBoxStatusEnum {
    PENDING,
    ACCEPTED,
    // Rider tapped "Start delivery" in the app and is on the way - see
    // DeliveryOperationsService.startDelivery. rider_box.status was a native
    // ENUM without this value until V1002 converted it to VARCHAR.
    IN_TRANSIT,
    REJECTED,
    DELIVERED

}

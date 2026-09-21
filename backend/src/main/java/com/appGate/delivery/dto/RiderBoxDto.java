package com.appGate.delivery.dto;

import lombok.Data;

@Data
public class RiderBoxDto {
    // The SalesOrder being handed to a rider - RiderBoxService resolves this to the
    // underlying mobile Order id (SalesOrder.mobileOrderId) before storing the assignment,
    // since that's the id space the rider-facing delivery endpoints read from.
    private Long salesOrderId;
    private Long riderId;
}

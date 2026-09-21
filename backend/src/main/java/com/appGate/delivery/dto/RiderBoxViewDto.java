package com.appGate.delivery.dto;

import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// A RiderBox row enriched with the assigned order's human-readable details. RiderBox itself
// only stores the mobile Order id (see RiderBoxService.assignProduct) - this looks the
// matching SalesOrder up so the admin screen can show the real order reference instead of
// a bare number.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiderBoxViewDto {
    private Long riderBoxId;
    private Long orderId;
    private String orderReferenceNo;
    private String customerName;
    private String deliveryAddress;
    private String productName;
    private RiderBoxStatusEnum status;
    private Long riderId;
    private Rider rider;
    private LocalDateTime createdAt;
}

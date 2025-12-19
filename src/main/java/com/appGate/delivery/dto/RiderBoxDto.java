package com.appGate.delivery.dto;

import com.appGate.delivery.enums.RiderBoxStatusEnum;
import lombok.Data;

@Data
public class RiderBoxDto {
    private Long orderId;
    private Long saleRef;
    private Long riderId;
}

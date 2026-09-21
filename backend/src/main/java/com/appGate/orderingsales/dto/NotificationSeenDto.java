package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSeenDto {
    private Integer orderList;
    private Integer cancelled;
    private Integer refund;
}

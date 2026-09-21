package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderDto {
    private String customerName;
    private String customerAccountNo;
    private String productReference;
    private String reason;
}

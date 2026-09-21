package com.appGate.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPaymentMethodDto {
    private String paymentType;
    private String accountId;
    private String lastFour;
    private Boolean isDefault;
}

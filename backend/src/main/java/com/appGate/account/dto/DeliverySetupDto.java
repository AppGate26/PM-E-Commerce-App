package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DeliverySetupDto {

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotNull(message = "Minimum weight is required")
    private BigDecimal weightMinKg;

    private BigDecimal weightMaxKg; // null = unbounded ("X kg and above")

    @NotNull(message = "Minimum distance is required")
    private BigDecimal distanceMinKm;

    private BigDecimal distanceMaxKm; // null = unbounded ("X km and above")

    @NotNull(message = "Delivery fee (rate per km) is required")
    private BigDecimal deliveryFee;

    @NotBlank(message = "Account to credit is required")
    private String accountToCredit;

    private Boolean isActive;
}

package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DeliverySetupDto {

    @NotBlank(message = "Category name is required")
    private String categoryName;

    private String weightKgGram;

    private BigDecimal distanceKm;

    @NotNull(message = "Delivery fee is required")
    private BigDecimal deliveryFee;

    private String accountToCredit;

    private Boolean isActive;
}

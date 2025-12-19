package com.appGate.account.dto;

import com.appGate.account.enums.InstallmentFrequency;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InstallmentPlanDto {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Product price is required")
    @Min(value = 1, message = "Product price must be greater than 0")
    private Double productPrice;

    @NotNull(message = "Frequency is required")
    private InstallmentFrequency frequency; // DAILY, WEEKLY, MONTHLY

    @NotNull(message = "Duration in months is required")
    @Min(value = 1, message = "Duration must be at least 1 month")
    private Integer durationInMonths;
}

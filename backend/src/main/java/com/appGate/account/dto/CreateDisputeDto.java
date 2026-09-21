package com.appGate.account.dto;

import com.appGate.account.enums.DisputeCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDisputeDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long paymentId;

    private String transactionReference;

    @NotNull(message = "Category is required")
    private DisputeCategory category;

    @NotNull(message = "Disputed amount is required")
    @Min(value = 1, message = "Disputed amount must be at least 1")
    private Double disputedAmount;

    private String description;
}

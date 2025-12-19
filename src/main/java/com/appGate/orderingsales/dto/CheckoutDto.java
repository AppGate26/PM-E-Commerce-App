package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.PaymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CheckoutDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    // Delivery information
    @NotBlank(message = "Delivery address is required")
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String deliveryAddress;

    @NotNull(message = "State ID is required")
    private Long deliveryStateId;

    @NotNull(message = "LGA ID is required")
    private Long deliveryLgaId;

    @NotNull(message = "Ward ID is required")
    private Long deliveryWardId;

    private String deliveryCountry = "Nigeria";

    private String deliveryPostalCode;

    @NotBlank(message = "Phone number is required")
    private String deliveryPhone;

    private String deliveryNotes;

    private String notes; // Customer notes

    // For installment payment
    private Long installmentPlanId; // If payment type is installment

    // Payment details
    private String email; // For payment gateway

    private String callbackUrl; // Payment callback URL
}

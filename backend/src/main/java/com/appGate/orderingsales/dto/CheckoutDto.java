package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.FulfillmentType;
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

    // Defaults to DELIVERY when omitted, for backward compatibility with
    // clients that predate this field. PICKUP orders skip the delivery
    // address/state/LGA requirement below and the distance-based fee -
    // see OrderService.checkout() for the conditional validation and
    // OrderService.calculateDeliveryFeeQuote() for the quote-side equivalent.
    private FulfillmentType fulfillmentType;

    // Delivery information - required only when fulfillmentType is DELIVERY
    // (or omitted). Not annotated @NotBlank/@NotNull here because the
    // requirement is conditional; OrderService.checkout() validates it.
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String deliveryAddress;

    private Long deliveryStateId;

    private Long deliveryLgaId;

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

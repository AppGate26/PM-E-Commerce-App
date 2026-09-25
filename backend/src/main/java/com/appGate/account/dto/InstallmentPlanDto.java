package com.appGate.account.dto;

import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.orderingsales.enums.FulfillmentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for previewing (POST /api/installments/calculate) or creating
 * (POST /api/installments) an installment plan for the caller's current cart.
 *
 * <p>The delivery fields are optional and mirror DeliveryFeeQuoteRequestDto (the same
 * shape the mobile app already sends to POST /orders/calculate-delivery-fee). Supply them
 * and the plan comes back with the delivery fee priced server-side and attached to the
 * FIRST payment only - {@code deliveryFee} plus {@code firstPaymentAmount} on
 * InstallmentPlanResponseDto - because delivery is never financed across the installments.
 * Omit them and deliveryFee is 0: the plan then describes the financed amount alone and
 * the delivery fee has to be quoted separately.
 */
@Data
public class InstallmentPlanDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Frequency is required")
    private InstallmentFrequency frequency; // DAILY, WEEKLY, MONTHLY

    @NotNull(message = "Duration in months is required")
    @Min(value = 1, message = "Duration must be at least 1 month")
    private Integer durationInMonths;

    // Insurance is optional. Null (older app builds that never send it) keeps the
    // previous behaviour of adding it.
    private Boolean includeInsurance = true;

    private FulfillmentType fulfillmentType;

    private String deliveryAddress;

    private Long deliveryStateId;

    private Long deliveryLgaId;

    private String deliveryCountry = "Nigeria";
}

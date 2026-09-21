package com.appGate.account.dto;

import com.appGate.orderingsales.enums.FulfillmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for paying an installment plan's up-front down payment before the
 * plan has an order attached - see
 * PaymentGatewayService.initializeDownPaymentBankTransfer.
 *
 * The delivery fee is always charged in full as part of the down payment - it is never
 * financed across the plan's installments. The delivery fields below are optional and
 * mirror DeliveryFeeQuoteRequestDto (the same shape the mobile app already sends to
 * POST /orders/calculate-delivery-fee): send fulfillmentType + address/state/LGA to have
 * the fee priced from this request, which is the accurate path. Omitting them does NOT
 * mean "no delivery fee" - PaymentGatewayService.resolveDownPaymentDeliveryFee falls back
 * to the fee this user was quoted moments earlier, since a fee left out of this charge
 * would never be collected at all.
 */
@Data
public class InitializeDownPaymentDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Callback URL is required")
    private String callbackUrl;

    private FulfillmentType fulfillmentType;

    private String deliveryAddress;

    private Long deliveryStateId;

    private Long deliveryLgaId;

    private String deliveryCountry = "Nigeria";
}

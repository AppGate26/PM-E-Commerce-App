package com.appGate.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentTermDto {

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;

    @NotNull(message = "Invoice amount is required")
    private BigDecimal invoiceAmount;

    private Long supplierId;

    @NotBlank(message = "Period of payment is required")
    private String periodOfPayment;

    private String rulesForPayment;

    private String advancePaymentDetails;

    private Integer percentageMade;

    private String tenureOfDelivery;

    private String processIncaseOfNondelivery;

    private String timelineOfDelivery;

    private String acceptedPaymentMethods;

    private BigDecimal discountOnOrder;

    private LocalDate paymentDate;
}

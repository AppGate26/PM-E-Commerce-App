package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.RefundMethod;
import com.appGate.orderingsales.enums.ReturnMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateReturnRequestDto {

    @NotNull(message = "Sales order ID is required")
    private Long salesOrderId;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotNull(message = "Return method is required")
    private ReturnMethod returnMethod;

    @NotNull(message = "Refund method is required")
    private RefundMethod refundMethod;

    // Required only when refundMethod is RECEIVE_OTHER_PRODUCT
    private Long replacementProductId;
    private String replacementProductName;
}

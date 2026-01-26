package com.appGate.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GoodsSuppliedDto {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private Long productId;

    @NotBlank(message = "Supplied product is required")
    private String suppliedProduct;

    private BigDecimal unitPrice;

    private BigDecimal deliveryFee;

    private BigDecimal totalAmount;

    private LocalDate dateSupplied;

    private String vehicleNumber;

    private String invoiceNumber;

    private String lpoNumber;

    private String waybillNumber;

    private String warehouseName;

    private String terminalCode;
}

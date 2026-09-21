package com.appGate.inventory.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateStockDto {

    private String description;

    @Min(value = 0, message = "Quantity must be at least 0")
    private Integer quantity;

    @Min(value = 0, message = "Reorder level must be at least 0")
    private Integer reorderLevel;

    private String unitPrice;

    private String costPrice;

    private String sellingPrice;

    private String accountToCredit;

    private String accountToDebit;
}

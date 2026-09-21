package com.appGate.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StockDto {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long categoryId;

    private Long subCategoryId;

    private Long supplierId;

    private Long warehouseId;

    private String sourceType; // "supplier" or "warehouse"

    private String description;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be at least 0")
    private Integer quantity;

    @Min(value = 0, message = "Reorder level must be at least 0")
    private Integer reorderLevel;

    @NotNull(message = "Unit price is required")
    private String unitPrice;

    // Cost price (purchase) and selling price shown on the stock register.
    private String costPrice;

    private String sellingPrice;

    private String accountToCredit;

    private String accountToDebit;

    private LocalDate stockDate;

    private Long enteredBy;

    private Boolean isOpeningStock; // Flag to mark as opening stock

    // null = central/HQ stock; set to a branchId for branch-level stock
    private Long branchId;
}


package com.appGate.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductDto {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255, message = "Product name must be between 3 and 255 characters")
    private String productName;

    @NotBlank(message = "Product description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String productDescription;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Sub-category ID is required")
    private Long subCategoryId;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    private Double sellingPrice;

    @NotNull(message = "Cost price is required")
    @DecimalMin(value = "0.01", message = "Cost price must be greater than 0")
    private Double costPrice;

    private Long supplierId;

    @NotBlank(message = "Manufacturer name is required")
    private String manufacturerName;

    @NotNull(message = "Initial quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    // For image upload
    private MultipartFile productImage;

    // For stock management
    @Min(value = 0, message = "Reorder level cannot be negative")
    private Integer reorderLevel = 10; // Default reorder level
}

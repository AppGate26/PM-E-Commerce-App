package com.appGate.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateReviewDto {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userName;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must not exceed 5")
    private Integer rating;

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Comment must not exceed 2000 characters")
    private String comment;

    private Boolean isVerifiedPurchase = false;

    private String images; // Comma-separated image URLs
}

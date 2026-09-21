package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DiscountSetupDto {

    @NotBlank(message = "Category name is required")
    private String categoryName;

    private String subCategory;

    private BigDecimal discountPercentage;

    private Boolean isActive;
}

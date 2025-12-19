package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductInfoDto {
    private String productName;
    private String productId;
    private String referenceNo;
    private String category;
    private String subCategory;
    private String description;
    private BigDecimal price;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal discount;
    private String coupon;
}

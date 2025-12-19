package com.appGate.orderingsales.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class WishListDto {
    private Long id;

    @NotNull(message = "Product id is required")
    private Long productId;

    @NotNull(message = "User id is required")
    private Long userId;
    private Boolean status;
}
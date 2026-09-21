package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.models.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Wire-identical mirror of {@link OrderItem} as it's serialized today (the entity has
 * no Jackson exclusions of its own besides the {@code order} back-reference, which
 * this simply omits). Exists so {@link OrderDto} can stop returning the entity
 * directly - see OrderDto for why.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private Double unitPrice;
    private Integer quantity;
    private Double subtotal;
    private Double discount;
    private Double total;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderItemDto from(OrderItem item) {
        if (item == null) {
            return null;
        }
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .productImage(item.getProductImage())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .discount(item.getDiscount())
                .total(item.getTotal())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}

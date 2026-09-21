package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.CartDto;
import com.appGate.orderingsales.dto.UpdateCartDto;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping("/add")
    public BaseResponse addToCart(@Valid @RequestBody CartDto cartDto) {
        return cartService.addToCart(cartDto);
    }

    @GetMapping("/{userId}")
    public BaseResponse getUserCart(@PathVariable Long userId) {
        return cartService.getUserCart(userId);
    }

    @GetMapping("/{userId}/summary")
    public BaseResponse getCartSummary(@PathVariable Long userId) {
        return cartService.getCartSummary(userId);
    }

    @PutMapping("/{userId}/items/{productId}")
    public BaseResponse updateCartItemQuantity(
            @PathVariable Long userId,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartDto updateCartDto) {
        return cartService.updateCartItemQuantity(userId, productId, updateCartDto.getQuantity());
    }

    @DeleteMapping("/{userId}/items/{productId}")
    public BaseResponse removeFromCart(
            @PathVariable Long userId,
            @PathVariable Long productId) {
        return cartService.removeFromCart(userId, productId);
    }

    @DeleteMapping("/{userId}/clear")
    public BaseResponse clearCart(@PathVariable Long userId) {
        return cartService.clearCart(userId);
    }
}

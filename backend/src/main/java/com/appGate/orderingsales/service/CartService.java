package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.CartDto;
import com.appGate.orderingsales.models.Cart;
import com.appGate.orderingsales.repository.CartRepository;
import com.appGate.orderingsales.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    @Transactional
    public BaseResponse addToCart(CartDto cartDto) {
        try {
            // Check if item already in cart
            Optional<Cart> existingCart = cartRepository.findByUserIdAndProductIdAndStatus(
                cartDto.getUserId(),
                cartDto.getProductId(),
                true
            );

            Cart cart;
            if (existingCart.isPresent()) {
                // Update quantity
                cart = existingCart.get();
                cart.setQuantity(cart.getQuantity() + cartDto.getQuantity());
            } else {
                // Create new cart item
                cart = new Cart();
                cart.setUserId(cartDto.getUserId());
                cart.setProductId(cartDto.getProductId());
                cart.setQuantity(cartDto.getQuantity());
                cart.setStatus(true);
            }

            Cart savedCart = cartRepository.save(cart);

            return new BaseResponse(HttpStatus.CREATED.value(), "Item added to cart successfully", savedCart);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to add item to cart: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserCart(Long userId) {
        try {
            List<Cart> cartItems = cartRepository.findByUserIdAndStatus(userId, true);

            return new BaseResponse(HttpStatus.OK.value(), "Cart retrieved successfully", cartItems);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to retrieve cart: " + e.getMessage(), null);
        }
    }

    public BaseResponse getCartSummary(Long userId) {
        try {
            List<Cart> cartItems = cartRepository.findByUserIdAndStatus(userId, true);

            // Calculate totals
            int totalItems = cartItems.stream()
                    .mapToInt(Cart::getQuantity)
                    .sum();

            // Note: Product prices would need to be fetched from inventory-service
            // For now, returning basic summary
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalItems", totalItems);
            summary.put("items", cartItems);
            summary.put("itemCount", cartItems.size());

            return new BaseResponse(HttpStatus.OK.value(), "Cart summary retrieved successfully", summary);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to retrieve cart summary: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updateCartItemQuantity(Long userId, Long productId, Integer newQuantity) {
        try {
            Cart cart = cartRepository.findByUserIdAndProductIdAndStatus(userId, productId, true)
                    .orElseThrow(() -> new RuntimeException("Cart item not found"));

            cart.setQuantity(newQuantity);
            Cart updatedCart = cartRepository.save(cart);

            return new BaseResponse(HttpStatus.OK.value(), "Cart item updated successfully", updatedCart);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to update cart item: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse removeFromCart(Long userId, Long productId) {
        try {
            Cart cart = cartRepository.findByUserIdAndProductIdAndStatus(userId, productId, true)
                    .orElseThrow(() -> new RuntimeException("Cart item not found"));

            cart.setStatus(false); // Soft delete
            cartRepository.save(cart);

            return new BaseResponse(HttpStatus.OK.value(), "Item removed from cart successfully", null);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to remove item from cart: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse clearCart(Long userId) {
        try {
            List<Cart> cartItems = cartRepository.findByUserIdAndStatus(userId, true);
            cartItems.forEach(item -> item.setStatus(false));
            cartRepository.saveAll(cartItems);

            return new BaseResponse(HttpStatus.OK.value(), "Cart cleared successfully", null);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to clear cart: " + e.getMessage(), null);
        }
    }
}

package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.CheckoutDto;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public BaseResponse checkout(@Valid @RequestBody CheckoutDto checkoutDto) {
        return orderService.checkout(checkoutDto);
    }

    @GetMapping("/number/{orderNumber}")
    public BaseResponse getOrderByOrderNumber(@PathVariable String orderNumber) {
        return orderService.getOrderByOrderNumber(orderNumber);
    }

    @GetMapping("/{orderId}")
    public BaseResponse getOrderDetails(@PathVariable Long orderId) {
        return orderService.getOrderDetails(orderId);
    }

    @GetMapping("/user/{userId}")
    public BaseResponse getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return orderService.getUserOrders(userId, page, size);
    }

    @GetMapping("/user/{userId}/status/{status}")
    public BaseResponse getUserOrdersByStatus(
            @PathVariable Long userId,
            @PathVariable OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return orderService.getUserOrdersByStatus(userId, status, page, size);
    }

    @GetMapping("/user/{userId}/statistics")
    public BaseResponse getOrderStatistics(@PathVariable Long userId) {
        return orderService.getOrderStatistics(userId);
    }

    @PutMapping("/{orderId}/status")
    public BaseResponse updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status) {
        return orderService.updateOrderStatus(orderId, status);
    }

    @PutMapping("/{orderId}/cancel")
    public BaseResponse cancelOrder(
            @PathVariable Long orderId,
            @RequestParam String reason) {
        return orderService.cancelOrder(orderId, reason);
    }

    @PutMapping("/{orderId}/payment")
    public BaseResponse updatePaymentStatus(
            @PathVariable Long orderId,
            @RequestParam String paymentReference,
            @RequestParam boolean isPaid) {
        return orderService.updatePaymentStatus(orderId, paymentReference, isPaid);
    }

    // Rider endpoints
    @GetMapping("/rider/{riderId}")
    public BaseResponse getRiderOrders(
            @PathVariable Long riderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return orderService.getRiderOrders(riderId, page, size);
    }

    @PutMapping("/{orderId}/assign-rider/{riderId}")
    public BaseResponse assignRider(
            @PathVariable Long orderId,
            @PathVariable Long riderId) {
        return orderService.assignRider(orderId, riderId);
    }
}

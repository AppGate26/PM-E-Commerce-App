package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.DeliveryFeeQuoteRequestDto;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Checkout-adjacent endpoints that don't belong under /api/orders because they
 * don't operate on an existing order. Consumed by both the web and mobile clients.
 */
@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderService orderService;

    @PostMapping("/calculate-delivery-fee")
    public BaseResponse calculateDeliveryFee(@Valid @RequestBody DeliveryFeeQuoteRequestDto request) {
        return orderService.calculateDeliveryFeeQuote(request);
    }
}

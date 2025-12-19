package com.appGate.delivery.controller;

import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.TransitDeliveryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Delivery & Riders", description = "Delivery management and rider operations")
public class TransitDeliveryController {

    private final TransitDeliveryService transitDeliveryService;

    public TransitDeliveryController(TransitDeliveryService transitDeliveryService) {
        this.transitDeliveryService = transitDeliveryService;
    }

    @GetMapping("/transit-deliveries")
    public BaseResponse getAllTransitDeliveries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "shippedAt") String sortBy) {
        return transitDeliveryService.getAllTransitDeliveries(page, size, sortBy);
    }

    @PutMapping("/mark-delivered/{orderId}")
    public BaseResponse markAsDelivered(@PathVariable Long orderId) {
        return transitDeliveryService.markAsDelivered(orderId);
    }

    @GetMapping("/delivery-status/{orderId}")
    public BaseResponse getDeliveryStatus(@PathVariable Long orderId) {
        return transitDeliveryService.getDeliveryStatus(orderId);
    }
}

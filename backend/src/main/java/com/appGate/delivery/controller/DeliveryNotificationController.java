package com.appGate.delivery.controller;

import com.appGate.delivery.dto.DeliveryNotificationDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.DeliveryNotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Delivery & Riders", description = "Delivery management and rider operations")
public class DeliveryNotificationController {

    private final DeliveryNotificationService deliveryNotificationService;

    public DeliveryNotificationController(DeliveryNotificationService deliveryNotificationService) {
        this.deliveryNotificationService = deliveryNotificationService;
    }

    @GetMapping("/delivery-notifications")
    public BaseResponse getAllNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryNotificationService.getAllNotifications(page, size);
    }

    @PostMapping("/delivery-notifications")
    public BaseResponse createNotification(@Valid @RequestBody DeliveryNotificationDto dto) {
        return deliveryNotificationService.createNotification(dto);
    }

    @GetMapping("/delivery-notifications/{id}")
    public BaseResponse getNotificationById(@PathVariable Long id) {
        return deliveryNotificationService.getNotificationById(id);
    }

    @PutMapping("/delivery-notifications/{id}/mark-read")
    public BaseResponse markAsRead(@PathVariable Long id) {
        return deliveryNotificationService.markAsRead(id);
    }
}

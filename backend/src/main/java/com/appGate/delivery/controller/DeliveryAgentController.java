package com.appGate.delivery.controller;

import com.appGate.delivery.dto.DeliveryConfirmationDto;
import com.appGate.delivery.dto.DeliveryFeedbackDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.DeliveryOperationsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/delivery-agent")
@Tag(name = "Delivery Agent Operations", description = "Delivery agent authentication and delivery operations")
public class DeliveryAgentController {

    private final DeliveryOperationsService deliveryOperationsService;

    public DeliveryAgentController(DeliveryOperationsService deliveryOperationsService) {
        this.deliveryOperationsService = deliveryOperationsService;
    }

    @GetMapping("/pending-deliveries/{riderId}")
    public BaseResponse getPendingDeliveries(
            @PathVariable Long riderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryOperationsService.getPendingDeliveries(riderId, page, size);
    }

    @GetMapping("/delivery/{riderBoxId}")
    public BaseResponse getDeliveryDetails(@PathVariable Long riderBoxId) {
        return deliveryOperationsService.getDeliveryDetails(riderBoxId);
    }

    @PostMapping(value = "/confirm-delivery", consumes = "multipart/form-data")
    public BaseResponse confirmDelivery(
            @ModelAttribute @Valid DeliveryConfirmationDto dto,
            HttpServletRequest request) {
        return deliveryOperationsService.confirmDelivery(dto, request);
    }

    @PostMapping("/submit-feedback")
    public BaseResponse submitFeedback(@Valid @RequestBody DeliveryFeedbackDto dto) {
        return deliveryOperationsService.submitFeedback(dto);
    }

    @GetMapping("/history/{riderId}")
    public BaseResponse getDeliveryHistory(
            @PathVariable Long riderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        return deliveryOperationsService.getDeliveryHistory(riderId, startDate, endDate, search, page, size, sortBy);
    }
}

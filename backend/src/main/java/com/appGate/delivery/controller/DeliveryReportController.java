package com.appGate.delivery.controller;

import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.DeliveryReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@Tag(name = "Delivery & Riders", description = "Delivery management and rider operations")
public class DeliveryReportController {

    private final DeliveryReportService deliveryReportService;

    public DeliveryReportController(DeliveryReportService deliveryReportService) {
        this.deliveryReportService = deliveryReportService;
    }

    @GetMapping("/rider-box/{riderId}")
    public BaseResponse getRiderBoxReport(
            @PathVariable Long riderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryReportService.getRiderBoxReport(riderId, page, size);
    }

    @GetMapping("/rider-info")
    public BaseResponse getRiderInfoReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryReportService.getRiderInfoReport(page, size);
    }

    @GetMapping("/transit")
    public BaseResponse getTransitReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryReportService.getTransitReport(page, size);
    }

    @GetMapping("/deliveries")
    public BaseResponse getDeliveriesReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryReportService.getDeliveriesReport(page, size);
    }

    @GetMapping("/rider-box-display/{riderId}")
    public BaseResponse getRiderBoxDisplay(@PathVariable Long riderId) {
        return deliveryReportService.getRiderBoxDisplay(riderId);
    }
}

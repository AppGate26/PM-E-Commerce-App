package com.appGate.delivery.controller;

import com.appGate.delivery.dto.RiderFeedbackDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.DeliveryOperationsService;
import com.appGate.delivery.service.RiderFeedbackService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Delivery & Riders", description = "Delivery management and rider operations")
public class RiderFeedbackController {

    private final RiderFeedbackService riderFeedbackService;
    private final DeliveryOperationsService deliveryOperationsService;

    public RiderFeedbackController(RiderFeedbackService riderFeedbackService,
                                   DeliveryOperationsService deliveryOperationsService) {
        this.riderFeedbackService = riderFeedbackService;
        this.deliveryOperationsService = deliveryOperationsService;
    }

    // Feedback riders submit from the delivery app (POST /api/delivery-agent/submit-feedback),
    // joined to the delivery's product/customer. This is what the web Feedback Notification
    // page lists - /rider-feedback below is a separate, older table the app never writes to.
    @GetMapping("/delivery-feedback")
    public BaseResponse getDeliveryFeedback() {
        return deliveryOperationsService.getAllFeedback();
    }

    @GetMapping("/rider-feedback")
    public BaseResponse getAllFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return riderFeedbackService.getAllFeedback(page, size);
    }

    @PostMapping("/rider-feedback")
    public BaseResponse submitFeedback(@Valid @RequestBody RiderFeedbackDto dto) {
        return riderFeedbackService.submitFeedback(dto);
    }

    @GetMapping("/rider-feedback/{id}")
    public BaseResponse getFeedbackById(@PathVariable Long id) {
        return riderFeedbackService.getFeedbackById(id);
    }

    @GetMapping("/rider-feedback/rider/{riderId}")
    public BaseResponse getFeedbackByRider(@PathVariable Long riderId) {
        return riderFeedbackService.getFeedbackByRider(riderId);
    }
}

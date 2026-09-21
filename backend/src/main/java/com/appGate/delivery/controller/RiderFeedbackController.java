package com.appGate.delivery.controller;

import com.appGate.delivery.dto.RiderFeedbackDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.RiderFeedbackService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Delivery & Riders", description = "Delivery management and rider operations")
public class RiderFeedbackController {

    private final RiderFeedbackService riderFeedbackService;

    public RiderFeedbackController(RiderFeedbackService riderFeedbackService) {
        this.riderFeedbackService = riderFeedbackService;
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

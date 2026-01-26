package com.appGate.inventory.controller;

import com.appGate.inventory.dto.TestimonialDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.TestimonialService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Testimonials", description = "Customer testimonials management")
public class TestimonialController {

    private final TestimonialService testimonialService;

    @Operation(summary = "Create testimonial", description = "Admin: Create new customer testimonial with optional avatar image upload")
    @PostMapping(value = "/admin/testimonials", consumes = "multipart/form-data")
    public BaseResponse createTestimonial(
            @Valid @ModelAttribute TestimonialDto dto,
            HttpServletRequest request) {
        return testimonialService.createTestimonial(dto, request);
    }

    @Operation(summary = "Get all testimonials", description = "Admin: Retrieve all testimonials including inactive ones")
    @GetMapping("/admin/testimonials")
    public BaseResponse getAllTestimonials() {
        return testimonialService.getAllTestimonials();
    }

    @Operation(summary = "Get active testimonials", description = "Public: Get all active testimonials for display on website/mobile app")
    @GetMapping("/testimonials")
    public BaseResponse getActiveTestimonials() {
        return testimonialService.getActiveTestimonials();
    }

    @Operation(summary = "Get testimonial by ID", description = "Retrieve a specific testimonial by its ID")
    @GetMapping("/testimonials/{id}")
    public BaseResponse getTestimonialById(@PathVariable Long id) {
        return testimonialService.getTestimonialById(id);
    }

    @Operation(summary = "Update testimonial", description = "Admin: Update testimonial details including avatar image")
    @PutMapping(value = "/admin/testimonials/{id}", consumes = "multipart/form-data")
    public BaseResponse updateTestimonial(
            @PathVariable Long id,
            @Valid @ModelAttribute TestimonialDto dto,
            HttpServletRequest request) {
        return testimonialService.updateTestimonial(id, dto, request);
    }

    @Operation(summary = "Toggle testimonial status", description = "Admin: Toggle testimonial between active and inactive status")
    @PatchMapping("/admin/testimonials/{id}/toggle")
    public BaseResponse toggleTestimonialStatus(@PathVariable Long id) {
        return testimonialService.toggleTestimonialStatus(id);
    }

    @Operation(summary = "Delete testimonial", description = "Admin: Permanently delete a testimonial from the system")
    @DeleteMapping("/admin/testimonials/{id}")
    public BaseResponse deleteTestimonial(@PathVariable Long id) {
        return testimonialService.deleteTestimonial(id);
    }
}

package com.appGate.inventory.controller;

import com.appGate.inventory.dto.CreateReviewDto;
import com.appGate.inventory.dto.UpdateReviewDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.ProductReviewService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Product Review", description = "Products, categories, stock, and suppliers")
public class ProductReviewController {

    private final ProductReviewService reviewService;

    @PostMapping
    public BaseResponse createReview(@Valid @RequestBody CreateReviewDto dto) {
        return reviewService.createReview(dto);
    }

    @GetMapping("/product/{productId}")
    public BaseResponse getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return reviewService.getProductReviews(productId, page, size);
    }

    @GetMapping("/product/{productId}/stats")
    public BaseResponse getProductReviewStats(@PathVariable Long productId) {
        return reviewService.getProductReviewStats(productId);
    }

    @GetMapping("/user/{userId}")
    public BaseResponse getUserReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return reviewService.getUserReviews(userId, page, size);
    }

    @GetMapping("/{reviewId}")
    public BaseResponse getReviewById(@PathVariable Long reviewId) {
        return reviewService.getReviewById(reviewId);
    }

    @PutMapping("/{reviewId}")
    public BaseResponse updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewDto dto) {
        return reviewService.updateReview(reviewId, dto);
    }

    @DeleteMapping("/{reviewId}")
    public BaseResponse deleteReview(@PathVariable Long reviewId) {
        return reviewService.deleteReview(reviewId);
    }

    @PutMapping("/{reviewId}/helpful")
    public BaseResponse markHelpful(
            @PathVariable Long reviewId,
            @RequestParam boolean helpful) {
        return reviewService.markHelpful(reviewId, helpful);
    }

    // Admin endpoints
    @GetMapping("/admin/pending")
    public BaseResponse getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reviewService.getPendingReviews(page, size);
    }

    @PutMapping("/admin/{reviewId}/approve")
    public BaseResponse approveReview(@PathVariable Long reviewId) {
        return reviewService.approveReview(reviewId);
    }

    @PutMapping("/admin/{reviewId}/reject")
    public BaseResponse rejectReview(
            @PathVariable Long reviewId,
            @RequestParam String reason) {
        return reviewService.rejectReview(reviewId, reason);
    }

    @PutMapping("/admin/{reviewId}/response")
    public BaseResponse addAdminResponse(
            @PathVariable Long reviewId,
            @RequestParam String response) {
        return reviewService.addAdminResponse(reviewId, response);
    }
}

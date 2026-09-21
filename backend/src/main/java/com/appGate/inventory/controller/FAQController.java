package com.appGate.inventory.controller;

import com.appGate.inventory.dto.FAQDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.FAQService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - FAQ", description = "Frequently Asked Questions management")
public class FAQController {

    private final FAQService faqService;

    @Operation(summary = "Create new FAQ", description = "Admin: Create a new frequently asked question with answer and display order")
    @PostMapping("/admin/faqs")
    public BaseResponse createFAQ(@Valid @RequestBody FAQDto dto) {
        return faqService.createFAQ(dto);
    }

    @Operation(summary = "Get all FAQs", description = "Admin: Retrieve all FAQs including inactive ones")
    @GetMapping("/admin/faqs")
    public BaseResponse getAllFAQs() {
        return faqService.getAllFAQs();
    }

    @Operation(summary = "Get active FAQs", description = "Public: Get all active FAQs ordered by display order (for mobile app)")
    @GetMapping("/faqs")
    public BaseResponse getActiveFAQs() {
        return faqService.getActiveFAQs();
    }

    @Operation(summary = "Get FAQ by ID", description = "Retrieve a specific FAQ by its ID")
    @GetMapping("/faqs/{id}")
    public BaseResponse getFAQById(@PathVariable Long id) {
        return faqService.getFAQById(id);
    }

    @Operation(summary = "Update FAQ", description = "Admin: Update an existing FAQ's question, answer, or display order")
    @PutMapping("/admin/faqs/{id}")
    public BaseResponse updateFAQ(@PathVariable Long id, @Valid @RequestBody FAQDto dto) {
        return faqService.updateFAQ(id, dto);
    }

    @Operation(summary = "Toggle FAQ status", description = "Admin: Toggle FAQ between active and inactive status")
    @PatchMapping("/admin/faqs/{id}/toggle")
    public BaseResponse toggleFAQStatus(@PathVariable Long id) {
        return faqService.toggleFAQStatus(id);
    }

    @Operation(summary = "Delete FAQ", description = "Admin: Permanently delete an FAQ from the system")
    @DeleteMapping("/admin/faqs/{id}")
    public BaseResponse deleteFAQ(@PathVariable Long id) {
        return faqService.deleteFAQ(id);
    }
}

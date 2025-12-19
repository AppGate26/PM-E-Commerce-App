package com.appGate.inventory.controller;

import com.appGate.inventory.models.FAQ;
import com.appGate.inventory.models.Testimonial;
import com.appGate.inventory.repository.FAQRepository;
import com.appGate.inventory.repository.TestimonialRepository;
import com.appGate.inventory.response.BaseResponse;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Public", description = "Products, categories, stock, and suppliers")
public class PublicController {

    private final FAQRepository faqRepository;
    private final TestimonialRepository testimonialRepository;

    @GetMapping("/faqs")
    public BaseResponse getFAQs() {
        List<FAQ> faqs = faqRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return new BaseResponse(HttpStatus.OK.value(), "successful", faqs);
    }

    @GetMapping("/testimonials")
    public BaseResponse getTestimonials() {
        List<Testimonial> testimonials = testimonialRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "successful", testimonials);
    }
}

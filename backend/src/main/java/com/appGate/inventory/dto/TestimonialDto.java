package com.appGate.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.Nullable;

@Data
public class TestimonialDto {

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Testimonial is required")
    private String testimonial;

    @Nullable
    private MultipartFile avatar;

    private Boolean isActive;
}

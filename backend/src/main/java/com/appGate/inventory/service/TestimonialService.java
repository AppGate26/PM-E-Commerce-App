package com.appGate.inventory.service;

import com.appGate.inventory.dto.TestimonialDto;
import com.appGate.inventory.models.Testimonial;
import com.appGate.inventory.repository.TestimonialRepository;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.util.FileUploadUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TestimonialService {

    private final TestimonialRepository testimonialRepository;

    @Transactional
    public BaseResponse createTestimonial(TestimonialDto dto, HttpServletRequest request) {
        try {
            Testimonial testimonial = new Testimonial();
            testimonial.setName(dto.getName());
            testimonial.setTestimonial(dto.getTestimonial());
            testimonial.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            // Handle avatar upload
            if (dto.getAvatar() != null && !dto.getAvatar().isEmpty()) {
                String avatarPath = saveImage(dto.getAvatar(), "testimonial", getBaseUrl(request));
                testimonial.setAvatar(avatarPath);
            }

            Testimonial savedTestimonial = testimonialRepository.save(testimonial);
            return new BaseResponse(HttpStatus.CREATED.value(), "Testimonial created successfully", savedTestimonial);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating testimonial: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllTestimonials() {
        List<Testimonial> testimonials = testimonialRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Testimonials retrieved successfully", testimonials);
    }

    public BaseResponse getActiveTestimonials() {
        List<Testimonial> testimonials = testimonialRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active testimonials retrieved successfully", testimonials);
    }

    public BaseResponse getTestimonialById(Long id) {
        Testimonial testimonial = testimonialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testimonial not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Testimonial retrieved successfully", testimonial);
    }

    @Transactional
    public BaseResponse updateTestimonial(Long id, TestimonialDto dto, HttpServletRequest request) {
        try {
            Testimonial testimonial = testimonialRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Testimonial not found"));

            if (dto.getName() != null) {
                testimonial.setName(dto.getName());
            }
            if (dto.getTestimonial() != null) {
                testimonial.setTestimonial(dto.getTestimonial());
            }
            if (dto.getIsActive() != null) {
                testimonial.setIsActive(dto.getIsActive());
            }

            // Handle avatar update
            if (dto.getAvatar() != null && !dto.getAvatar().isEmpty()) {
                String avatarPath = saveImage(dto.getAvatar(), "testimonial", getBaseUrl(request));
                testimonial.setAvatar(avatarPath);
            }

            Testimonial updatedTestimonial = testimonialRepository.save(testimonial);
            return new BaseResponse(HttpStatus.OK.value(), "Testimonial updated successfully", updatedTestimonial);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating testimonial: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteTestimonial(Long id) {
        try {
            Testimonial testimonial = testimonialRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Testimonial not found"));
            testimonialRepository.delete(testimonial);
            return new BaseResponse(HttpStatus.OK.value(), "Testimonial deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting testimonial: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse toggleTestimonialStatus(Long id) {
        try {
            Testimonial testimonial = testimonialRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Testimonial not found"));
            testimonial.setIsActive(!testimonial.getIsActive());
            Testimonial updatedTestimonial = testimonialRepository.save(testimonial);
            return new BaseResponse(HttpStatus.OK.value(), "Testimonial status toggled successfully", updatedTestimonial);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error toggling testimonial status: " + e.getMessage(), null);
        }
    }

    private String saveImage(MultipartFile file, String uploadDir, String baseUrl) {
        String fileSavedPath = "";
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            fileSavedPath = FileUploadUtil.saveImage(uploadDir, FileUploadUtil.generateUniqueName(fileName), file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.EXPECTATION_FAILED, "error", e);
        }
        return baseUrl + "/api/users/customer/image/" + fileSavedPath;
    }

    private String getBaseUrl(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedProto = request.getHeader("X-Forwarded-Proto");

        if (forwardedHost != null && forwardedProto != null) {
            return forwardedProto + "://" + forwardedHost;
        }

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();

        String baseUrl = scheme + "://" + serverName;
        if ((scheme.equals("http") && serverPort != 80) || (scheme.equals("https") && serverPort != 443)) {
            baseUrl += ":" + serverPort;
        }

        return baseUrl;
    }
}

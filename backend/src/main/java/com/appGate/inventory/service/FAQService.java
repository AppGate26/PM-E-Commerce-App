package com.appGate.inventory.service;

import com.appGate.inventory.dto.FAQDto;
import com.appGate.inventory.models.FAQ;
import com.appGate.inventory.repository.FAQRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FAQService {

    private final FAQRepository faqRepository;

    @Transactional
    public BaseResponse createFAQ(FAQDto dto) {
        try {
            FAQ faq = new FAQ();
            faq.setQuestion(dto.getQuestion());
            faq.setAnswer(dto.getAnswer());
            faq.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
            faq.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            FAQ savedFAQ = faqRepository.save(faq);
            return new BaseResponse(HttpStatus.CREATED.value(), "FAQ created successfully", savedFAQ);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating FAQ: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllFAQs() {
        List<FAQ> faqs = faqRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "FAQs retrieved successfully", faqs);
    }

    public BaseResponse getActiveFAQs() {
        List<FAQ> faqs = faqRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return new BaseResponse(HttpStatus.OK.value(), "Active FAQs retrieved successfully", faqs);
    }

    public BaseResponse getFAQById(Long id) {
        FAQ faq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found"));
        return new BaseResponse(HttpStatus.OK.value(), "FAQ retrieved successfully", faq);
    }

    @Transactional
    public BaseResponse updateFAQ(Long id, FAQDto dto) {
        try {
            FAQ faq = faqRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("FAQ not found"));

            if (dto.getQuestion() != null) {
                faq.setQuestion(dto.getQuestion());
            }
            if (dto.getAnswer() != null) {
                faq.setAnswer(dto.getAnswer());
            }
            if (dto.getDisplayOrder() != null) {
                faq.setDisplayOrder(dto.getDisplayOrder());
            }
            if (dto.getIsActive() != null) {
                faq.setIsActive(dto.getIsActive());
            }

            FAQ updatedFAQ = faqRepository.save(faq);
            return new BaseResponse(HttpStatus.OK.value(), "FAQ updated successfully", updatedFAQ);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating FAQ: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteFAQ(Long id) {
        try {
            FAQ faq = faqRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("FAQ not found"));
            faqRepository.delete(faq);
            return new BaseResponse(HttpStatus.OK.value(), "FAQ deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting FAQ: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse toggleFAQStatus(Long id) {
        try {
            FAQ faq = faqRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("FAQ not found"));
            faq.setIsActive(!faq.getIsActive());
            FAQ updatedFAQ = faqRepository.save(faq);
            return new BaseResponse(HttpStatus.OK.value(), "FAQ status toggled successfully", updatedFAQ);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error toggling FAQ status: " + e.getMessage(), null);
        }
    }
}

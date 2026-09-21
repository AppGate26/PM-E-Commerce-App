package com.appGate.delivery.service;

import com.appGate.delivery.dto.RiderFeedbackDto;
import com.appGate.delivery.models.RiderFeedbackEntity;
import com.appGate.delivery.repository.RiderFeedbackRepository;
import com.appGate.delivery.response.BaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Service
public class RiderFeedbackService {

    private final RiderFeedbackRepository riderFeedbackRepository;

    public RiderFeedbackService(RiderFeedbackRepository riderFeedbackRepository) {
        this.riderFeedbackRepository = riderFeedbackRepository;
    }

    public BaseResponse getAllFeedback(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<RiderFeedbackEntity> feedbacks = riderFeedbackRepository.findAllByOrderByCreatedAtDesc(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", feedbacks.getContent());
        response.put("totalPages", feedbacks.getTotalPages());
        response.put("totalElements", feedbacks.getTotalElements());
        response.put("currentPage", feedbacks.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Feedback retrieved successfully", response);
    }

    public BaseResponse submitFeedback(RiderFeedbackDto dto) {
        RiderFeedbackEntity feedback = new RiderFeedbackEntity();
        feedback.setRiderId(dto.getRiderId());
        feedback.setRiderName(dto.getRiderName());
        feedback.setOrderId(dto.getOrderId());
        feedback.setDeliveryRating(dto.getDeliveryRating());
        feedback.setCustomerFeedback(dto.getCustomerFeedback());
        feedback.setIssuesEncountered(dto.getIssuesEncountered());
        feedback.setSuggestions(dto.getSuggestions());
        feedback.setFeedbackType(dto.getFeedbackType());

        RiderFeedbackEntity saved = riderFeedbackRepository.save(feedback);

        return new BaseResponse(HttpStatus.CREATED.value(), "Feedback submitted successfully", saved);
    }

    public BaseResponse getFeedbackById(Long id) {
        RiderFeedbackEntity feedback = riderFeedbackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found"));

        return new BaseResponse(HttpStatus.OK.value(), "Feedback retrieved successfully", feedback);
    }

    public BaseResponse getFeedbackByRider(Long riderId) {
        return new BaseResponse(HttpStatus.OK.value(), "Rider feedback retrieved successfully",
                riderFeedbackRepository.findByRiderIdOrderByCreatedAtDesc(riderId));
    }
}

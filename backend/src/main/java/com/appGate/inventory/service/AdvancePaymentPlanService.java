package com.appGate.inventory.service;

import com.appGate.inventory.dto.AdvancePaymentPlanDto;
import com.appGate.inventory.models.AdvancePaymentPlan;
import com.appGate.inventory.repository.AdvancePaymentPlanRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdvancePaymentPlanService {

    private final AdvancePaymentPlanRepository planRepository;

    @Transactional
    public BaseResponse createPlan(AdvancePaymentPlanDto dto) {
        try {
            AdvancePaymentPlan plan = new AdvancePaymentPlan();
            plan.setPlanName(dto.getPlanName());
            plan.setPercentagePaymentMade(dto.getPercentagePaymentMade());
            plan.setTimelineOfDeliverables(dto.getTimelineOfDeliverables());
            plan.setPaymentMilestones(dto.getPaymentMilestones());
            plan.setDescription(dto.getDescription());
            plan.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            AdvancePaymentPlan savedPlan = planRepository.save(plan);
            return new BaseResponse(HttpStatus.CREATED.value(), "Advance payment plan created successfully", savedPlan);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating plan: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllPlans() {
        List<AdvancePaymentPlan> plans = planRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Plans retrieved successfully", plans);
    }

    public BaseResponse getActivePlans() {
        List<AdvancePaymentPlan> plans = planRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active plans retrieved successfully", plans);
    }

    public BaseResponse getPlanById(Long id) {
        AdvancePaymentPlan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Plan retrieved successfully", plan);
    }

    @Transactional
    public BaseResponse updatePlan(Long id, AdvancePaymentPlanDto dto) {
        try {
            AdvancePaymentPlan plan = planRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));

            if (dto.getPlanName() != null) {
                plan.setPlanName(dto.getPlanName());
            }
            if (dto.getPercentagePaymentMade() != null) {
                plan.setPercentagePaymentMade(dto.getPercentagePaymentMade());
            }
            if (dto.getTimelineOfDeliverables() != null) {
                plan.setTimelineOfDeliverables(dto.getTimelineOfDeliverables());
            }
            if (dto.getPaymentMilestones() != null) {
                plan.setPaymentMilestones(dto.getPaymentMilestones());
            }
            if (dto.getDescription() != null) {
                plan.setDescription(dto.getDescription());
            }
            if (dto.getIsActive() != null) {
                plan.setIsActive(dto.getIsActive());
            }

            AdvancePaymentPlan updatedPlan = planRepository.save(plan);
            return new BaseResponse(HttpStatus.OK.value(), "Plan updated successfully", updatedPlan);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating plan: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deletePlan(Long id) {
        try {
            AdvancePaymentPlan plan = planRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));
            planRepository.delete(plan);
            return new BaseResponse(HttpStatus.OK.value(), "Plan deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting plan: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse togglePlanStatus(Long id) {
        try {
            AdvancePaymentPlan plan = planRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));
            plan.setIsActive(!plan.getIsActive());
            AdvancePaymentPlan updatedPlan = planRepository.save(plan);
            return new BaseResponse(HttpStatus.OK.value(), "Plan status toggled successfully", updatedPlan);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error toggling plan status: " + e.getMessage(), null);
        }
    }
}

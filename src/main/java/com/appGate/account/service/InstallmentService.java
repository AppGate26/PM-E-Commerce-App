package com.appGate.account.service;

import com.appGate.account.dto.InstallmentPlanDto;
import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import com.appGate.account.models.InstallmentPlan;
import com.appGate.account.repository.InstallmentPlanRepository;
import com.appGate.account.repository.InstallmentRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InstallmentService {

    private final InstallmentPlanRepository installmentPlanRepository;
    private final InstallmentRepository installmentRepository;

    // Insurance rate (10%)
    private static final Double INSURANCE_RATE = 0.10;

    // Down payment percentage (20%)
    private static final Double DOWN_PAYMENT_RATE = 0.20;

    @Transactional
    public BaseResponse calculateInstallmentPlan(InstallmentPlanDto dto) {
        try {
            // Calculate amounts
            Double productPrice = dto.getProductPrice();
            Double insuranceAmount = productPrice * INSURANCE_RATE;
            Double grandTotal = productPrice + insuranceAmount;
            Double downPayment = grandTotal * DOWN_PAYMENT_RATE;
            Double remainingBalance = grandTotal - downPayment;

            // Calculate number of installments based on frequency and duration
            Integer numberOfInstallments = calculateNumberOfInstallments(
                dto.getFrequency(),
                dto.getDurationInMonths()
            );

            // Calculate installment amount
            Double installmentAmount = remainingBalance / numberOfInstallments;

            // Create installment plan
            InstallmentPlan plan = new InstallmentPlan();
            plan.setOrderId(dto.getOrderId());
            plan.setUserId(dto.getUserId());
            plan.setProductId(dto.getProductId());
            plan.setTotalAmount(productPrice);
            plan.setInsuranceAmount(insuranceAmount);
            plan.setGrandTotal(grandTotal);
            plan.setDownPayment(downPayment);
            plan.setRemainingBalance(remainingBalance);
            plan.setInstallmentAmount(installmentAmount);
            plan.setFrequency(dto.getFrequency());
            plan.setNumberOfInstallments(numberOfInstallments);
            plan.setStatus(InstallmentStatus.ACTIVE);
            plan.setStartDate(LocalDate.now());
            plan.setNextPaymentDate(calculateNextPaymentDate(LocalDate.now(), dto.getFrequency()));
            plan.setEarlyShipmentEligible(false);

            // Generate installment schedule
            List<Installment> installments = generateInstallmentSchedule(
                plan,
                numberOfInstallments,
                installmentAmount,
                dto.getFrequency()
            );
            plan.setInstallments(installments);

            // Save plan
            InstallmentPlan savedPlan = installmentPlanRepository.save(plan);

            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Installment plan created successfully")
                    .data(savedPlan)
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to create installment plan: " + e.getMessage())
                    .build();
        }
    }

    private Integer calculateNumberOfInstallments(InstallmentFrequency frequency, Integer months) {
        return switch (frequency) {
            case DAILY -> months * 30; // Approximate
            case WEEKLY -> months * 4;
            case MONTHLY -> months;
        };
    }

    private LocalDate calculateNextPaymentDate(LocalDate currentDate, InstallmentFrequency frequency) {
        return switch (frequency) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> currentDate.plusMonths(1);
        };
    }

    private List<Installment> generateInstallmentSchedule(
            InstallmentPlan plan,
            Integer numberOfInstallments,
            Double installmentAmount,
            InstallmentFrequency frequency) {

        List<Installment> installments = new ArrayList<>();
        LocalDate currentDueDate = plan.getStartDate();

        for (int i = 1; i <= numberOfInstallments; i++) {
            currentDueDate = calculateNextPaymentDate(currentDueDate, frequency);

            Installment installment = new Installment();
            installment.setInstallmentPlan(plan);
            installment.setInstallmentNumber(i);
            installment.setAmountDue(installmentAmount);
            installment.setDueDate(currentDueDate);
            installment.setStatus(InstallmentStatus.PENDING);
            installment.setAmountPaid(0.0);
            installment.setDaysOverdue(0);

            installments.add(installment);
        }

        return installments;
    }

    public BaseResponse getInstallmentPlan(Long planId) {
        return installmentPlanRepository.findById(planId)
                .map(plan -> BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Installment plan retrieved successfully")
                        .data(plan)
                        .build())
                .orElse(BaseResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Installment plan not found")
                        .build());
    }

    public BaseResponse getUserInstallmentPlans(Long userId) {
        List<InstallmentPlan> plans = installmentPlanRepository.findByUserId(userId);

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("User installment plans retrieved successfully")
                .data(plans)
                .build();
    }

    public BaseResponse getInstallmentSchedule(Long planId) {
        List<Installment> installments = installmentRepository.findByInstallmentPlanId(planId);

        // Create detailed breakdown
        Map<String, Object> response = new HashMap<>();
        response.put("installments", installments);
        response.put("totalInstallments", installments.size());
        response.put("paidInstallments", installments.stream()
            .filter(i -> i.getStatus() == InstallmentStatus.PAID)
            .count());
        response.put("pendingInstallments", installments.stream()
            .filter(i -> i.getStatus() == InstallmentStatus.PENDING)
            .count());

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Installment schedule retrieved successfully")
                .data(response)
                .build();
    }

    public BaseResponse getUpcomingPayments(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate nextMonth = today.plusMonths(1);

        List<Installment> upcomingInstallments = installmentRepository
            .findUpcomingPayments(userId, today, nextMonth);

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Upcoming payments retrieved successfully")
                .data(upcomingInstallments)
                .build();
    }

    @Transactional
    public BaseResponse payInstallment(Long installmentId) {
        try {
            Installment installment = installmentRepository.findById(installmentId)
                    .orElseThrow(() -> new RuntimeException("Installment not found"));

            if (installment.getStatus() == InstallmentStatus.PAID) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Installment already paid")
                        .build();
            }

            // Mark as paid
            installment.setStatus(InstallmentStatus.PAID);
            installment.setPaidDate(LocalDate.now());
            installment.setAmountPaid(installment.getAmountDue());
            installmentRepository.save(installment);

            // Update installment plan
            InstallmentPlan plan = installment.getInstallmentPlan();
            plan.setCompletedInstallments(plan.getCompletedInstallments() + 1);

            // Check for early shipment eligibility (after 2nd payment)
            if (plan.getCompletedInstallments() >= 2) {
                plan.setEarlyShipmentEligible(true);
            }

            // Check if all installments are paid
            if (plan.getCompletedInstallments().equals(plan.getNumberOfInstallments())) {
                plan.setStatus(InstallmentStatus.COMPLETED);
                plan.setCompletionDate(LocalDate.now());
            }

            installmentPlanRepository.save(plan);

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Installment payment recorded successfully")
                    .data(installment)
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to process installment payment: " + e.getMessage())
                    .build();
        }
    }
}

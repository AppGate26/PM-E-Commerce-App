package com.appGate.staffpayroll.service;

import com.appGate.staffpayroll.dto.StaffAdvanceRepaymentDto;
import com.appGate.staffpayroll.models.StaffAdvance;
import com.appGate.staffpayroll.models.StaffAdvanceRepayment;
import com.appGate.staffpayroll.repository.StaffAdvanceRepaymentRepository;
import com.appGate.staffpayroll.repository.StaffAdvanceRepository;
import com.appGate.staffpayroll.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffAdvanceRepaymentService {

    private final StaffAdvanceRepaymentRepository repaymentRepository;
    private final StaffAdvanceRepository advanceRepository;

    @Transactional
    public BaseResponse recordRepayment(StaffAdvanceRepaymentDto dto) {
        try {
            StaffAdvance advance = advanceRepository.findById(dto.getAdvanceId())
                    .orElseThrow(() -> new RuntimeException("Advance not found: " + dto.getAdvanceId()));

            StaffAdvanceRepayment repayment = new StaffAdvanceRepayment();
            repayment.setAdvanceId(dto.getAdvanceId());
            repayment.setStaffId(advance.getStaffId());
            repayment.setBranchId(advance.getBranchId());
            repayment.setRepaymentDate(dto.getRepaymentDate() != null ? dto.getRepaymentDate() : LocalDate.now());
            repayment.setAmount(dto.getAmount());
            repayment.setMonth(dto.getMonth());
            repayment.setStatus(dto.getStatus() != null ? dto.getStatus() : "COMPLETED");
            repayment.setRemarks(dto.getRemarks());

            StaffAdvanceRepayment saved = repaymentRepository.save(repayment);

            updateAdvanceTotalRepaid(dto.getAdvanceId());

            return new BaseResponse(200, "Repayment recorded successfully", saved);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse generateRepaymentSchedule(Long advanceId) {
        try {
            StaffAdvance advance = advanceRepository.findById(advanceId)
                    .orElseThrow(() -> new RuntimeException("Advance not found: " + advanceId));

            List<StaffAdvanceRepayment> existingRepayments = repaymentRepository.findByAdvanceId(advanceId);
            if (!existingRepayments.isEmpty()) {
                return new BaseResponse(200, "Repayment schedule already exists for this advance", existingRepayments);
            }

            List<StaffAdvanceRepayment> schedule = new ArrayList<>();
            BigDecimal monthlyAmount = advance.getMonthlyDeduction() != null
                    ? advance.getMonthlyDeduction()
                    : advance.getAmount().divide(BigDecimal.valueOf(advance.getTenure()), 2, java.math.RoundingMode.HALF_UP);

            LocalDate startDate = advance.getDisbursedDate() != null ? advance.getDisbursedDate() : LocalDate.now();
            int tenure = advance.getTenure() != null ? advance.getTenure() : 12;

            for (int i = 0; i < tenure; i++) {
                StaffAdvanceRepayment repayment = new StaffAdvanceRepayment();
                LocalDate repaymentDate = startDate.plusMonths(i + 1);

                repayment.setAdvanceId(advanceId);
                repayment.setStaffId(advance.getStaffId());
                repayment.setBranchId(advance.getBranchId());
                repayment.setRepaymentDate(repaymentDate);
                repayment.setAmount(monthlyAmount);
                repayment.setMonth(YearMonth.from(repaymentDate).toString());
                repayment.setStatus("PENDING");

                schedule.add(repayment);
            }

            repaymentRepository.saveAll(schedule);
            return new BaseResponse(200, "Repayment schedule generated successfully", schedule);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }

    public BaseResponse getRepaymentSchedule(Long advanceId) {
        try {
            List<StaffAdvanceRepayment> schedule = repaymentRepository.findByAdvanceIdOrderByRepaymentDateAsc(advanceId);
            return new BaseResponse(200, "Repayment schedule retrieved", schedule);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }

    public BaseResponse getStaffRepayments(Long staffId) {
        try {
            List<StaffAdvanceRepayment> repayments = repaymentRepository.findByStaffId(staffId);
            return new BaseResponse(200, "Staff repayments retrieved", repayments);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updateRepaymentStatus(Long repaymentId, String status, Long recordedBy) {
        try {
            StaffAdvanceRepayment repayment = repaymentRepository.findById(repaymentId)
                    .orElseThrow(() -> new RuntimeException("Repayment not found: " + repaymentId));

            repayment.setStatus(status);
            repayment.setRecordedBy(recordedBy);

            StaffAdvanceRepayment updated = repaymentRepository.save(repayment);
            updateAdvanceTotalRepaid(repayment.getAdvanceId());

            return new BaseResponse(200, "Repayment status updated", updated);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }

    @Transactional
    private void updateAdvanceTotalRepaid(Long advanceId) {
        StaffAdvance advance = advanceRepository.findById(advanceId).orElse(null);
        if (advance != null) {
            BigDecimal totalRepaid = repaymentRepository.getTotalRepaidByAdvanceId(advanceId);
            advance.setTotalRepayment(totalRepaid != null ? totalRepaid : BigDecimal.ZERO);
            advanceRepository.save(advance);
        }
    }

    public BaseResponse deleteRepayment(Long repaymentId) {
        try {
            StaffAdvanceRepayment repayment = repaymentRepository.findById(repaymentId)
                    .orElseThrow(() -> new RuntimeException("Repayment not found: " + repaymentId));

            Long advanceId = repayment.getAdvanceId();
            repaymentRepository.deleteById(repaymentId);
            updateAdvanceTotalRepaid(advanceId);

            return new BaseResponse(200, "Repayment deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(500, e.getMessage(), null);
        }
    }
}

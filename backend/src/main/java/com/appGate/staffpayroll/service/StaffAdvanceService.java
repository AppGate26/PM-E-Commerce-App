package com.appGate.staffpayroll.service;

import com.appGate.staffpayroll.dto.StaffAdvanceDto;
import com.appGate.staffpayroll.models.Staff;
import com.appGate.staffpayroll.models.StaffAdvance;
import com.appGate.staffpayroll.repository.StaffAdvanceRepository;
import com.appGate.staffpayroll.repository.StaffRepository;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffAdvanceService {

    private final StaffAdvanceRepository staffAdvanceRepository;
    private final StaffRepository staffRepository;
    private final BranchScopeService branchScopeService;

    /** Load an advance, refusing one raised at another branch. */
    private StaffAdvance loadAdvanceInScope(Long id) {
        StaffAdvance advance = staffAdvanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Advance record not found"));
        branchScopeService.assertCanAccess(advance.getBranchId());
        return advance;
    }

    public BaseResponse createAdvance(StaffAdvanceDto dto) {
        try {
            Staff staff = dto.getStaffId() != null
                    ? staffRepository.findById(dto.getStaffId()).orElse(null)
                    : null;
            if (staff != null) {
                // Refuse an advance raised against another branch's staff.
                branchScopeService.assertCanAccess(staff.getBranchId());
            }

            StaffAdvance advance = new StaffAdvance();
            advance.setStaffId(dto.getStaffId());
            if (staff != null) {
                advance.setStaffCode(staff.getStaffId());
                advance.setStaffName(staff.getFullName());
                // Follow the staff member's branch rather than the requester's, so an
                // admin raising an advance for a branch staffer files it at that branch.
                advance.setBranchId(staff.getBranchId());
            }
            advance.setRequestDate(dto.getRequestDate());
            advance.setAmount(dto.getAmount());
            advance.setTenure(dto.getTenure());

            BigDecimal rate = dto.getInterestRate() != null ? dto.getInterestRate() : BigDecimal.ZERO;
            advance.setInterestRate(rate);
            advance.setReceiverAccountName(dto.getReceiverAccountName());
            advance.setReceiverAccountNumber(dto.getReceiverAccountNumber());
            advance.setReceiverBankName(dto.getReceiverBankName());
            advance.setReason(dto.getReason());
            advance.setStatus("PENDING");

            if (dto.getAmount() != null && dto.getTenure() != null && dto.getTenure() > 0) {
                BigDecimal interestAmount = dto.getAmount()
                        .multiply(rate)
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                BigDecimal total = dto.getAmount().add(interestAmount);
                advance.setTotalRepayment(total.setScale(2, RoundingMode.HALF_UP));
                advance.setMonthlyDeduction(
                        total.divide(BigDecimal.valueOf(dto.getTenure()), 2, RoundingMode.HALF_UP));
            }

            StaffAdvance saved = staffAdvanceRepository.save(advance);
            return new BaseResponse(HttpStatus.CREATED.value(), "Staff advance registered successfully", saved);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error registering advance: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllAdvances() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<StaffAdvance> advances = branchId == null
                ? staffAdvanceRepository.findAllByOrderByCreatedAtDesc()
                : staffAdvanceRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Success", advances);
    }

    public BaseResponse getAdvancesByStaffId(Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        branchScopeService.assertCanAccess(staff.getBranchId());
        List<StaffAdvance> advances = staffAdvanceRepository.findByStaffId(staffId);
        return new BaseResponse(HttpStatus.OK.value(), "Success", advances);
    }

    public BaseResponse approveAdvance(Long id, Long approvedBy) {
        try {
            StaffAdvance advance = loadAdvanceInScope(id);
            advance.setStatus("APPROVED");
            advance.setApprovedBy(approvedBy);
            StaffAdvance saved = staffAdvanceRepository.save(advance);
            return new BaseResponse(HttpStatus.OK.value(), "Advance approved", saved);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error approving advance: " + e.getMessage(), null);
        }
    }

    public BaseResponse disburseAdvance(Long id, Long disbursedBy) {
        try {
            StaffAdvance advance = loadAdvanceInScope(id);
            if (!"APPROVED".equalsIgnoreCase(advance.getStatus())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Advance must be APPROVED before it can be disbursed", null);
            }
            advance.setStatus("DISBURSED");
            advance.setDisbursedBy(disbursedBy);
            advance.setDisbursedDate(java.time.LocalDate.now());
            StaffAdvance saved = staffAdvanceRepository.save(advance);
            return new BaseResponse(HttpStatus.OK.value(), "Advance disbursed", saved);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error disbursing advance: " + e.getMessage(), null);
        }
    }
}

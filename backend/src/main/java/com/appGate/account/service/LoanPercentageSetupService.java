package com.appGate.account.service;

import com.appGate.account.dto.LoanPercentageSetupDto;
import com.appGate.account.models.LoanPercentageSetup;
import com.appGate.account.repository.LoanPercentageSetupRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanPercentageSetupService {

    private final LoanPercentageSetupRepository loanPercentageSetupRepository;

    @Transactional
    public BaseResponse createLoanPercentageSetup(LoanPercentageSetupDto dto) {
        try {
            LoanPercentageSetup setup = new LoanPercentageSetup();
            setup.setCategoryName(dto.getCategoryName());
            setup.setSetupRate(dto.getSetupRate());
            setup.setNewRate(dto.getNewRate());
            setup.setIncomeGlCode(dto.getIncomeGlCode());
            setup.setLoanInterestType(dto.getLoanInterestType());
            setup.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            LoanPercentageSetup savedSetup = loanPercentageSetupRepository.save(setup);
            return new BaseResponse(HttpStatus.CREATED.value(), "Loan percentage setup created successfully", savedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating loan percentage setup: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllLoanPercentageSetups() {
        List<LoanPercentageSetup> setups = loanPercentageSetupRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Loan percentage setups retrieved successfully", setups);
    }

    public BaseResponse getActiveLoanPercentageSetups() {
        List<LoanPercentageSetup> setups = loanPercentageSetupRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active loan percentage setups retrieved successfully", setups);
    }

    public BaseResponse getLoanPercentageSetupById(Long id) {
        LoanPercentageSetup setup = loanPercentageSetupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan percentage setup not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Loan percentage setup retrieved successfully", setup);
    }

    @Transactional
    public BaseResponse updateLoanPercentageSetup(Long id, LoanPercentageSetupDto dto) {
        try {
            LoanPercentageSetup setup = loanPercentageSetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Loan percentage setup not found"));

            if (dto.getCategoryName() != null) {
                setup.setCategoryName(dto.getCategoryName());
            }
            if (dto.getSetupRate() != null) {
                setup.setSetupRate(dto.getSetupRate());
            }
            if (dto.getNewRate() != null) {
                setup.setNewRate(dto.getNewRate());
            }
            if (dto.getIncomeGlCode() != null) {
                setup.setIncomeGlCode(dto.getIncomeGlCode());
            }
            if (dto.getLoanInterestType() != null) {
                setup.setLoanInterestType(dto.getLoanInterestType());
            }
            if (dto.getIsActive() != null) {
                setup.setIsActive(dto.getIsActive());
            }

            LoanPercentageSetup updatedSetup = loanPercentageSetupRepository.save(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Loan percentage setup updated successfully", updatedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating loan percentage setup: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteLoanPercentageSetup(Long id) {
        try {
            LoanPercentageSetup setup = loanPercentageSetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Loan percentage setup not found"));
            loanPercentageSetupRepository.delete(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Loan percentage setup deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting loan percentage setup: " + e.getMessage(), null);
        }
    }
}

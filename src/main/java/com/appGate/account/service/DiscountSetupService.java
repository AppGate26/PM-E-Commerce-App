package com.appGate.account.service;

import com.appGate.account.dto.DiscountSetupDto;
import com.appGate.account.models.DiscountSetup;
import com.appGate.account.repository.DiscountSetupRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountSetupService {

    private final DiscountSetupRepository discountSetupRepository;

    @Transactional
    public BaseResponse createDiscountSetup(DiscountSetupDto dto) {
        try {
            DiscountSetup setup = new DiscountSetup();
            setup.setCategoryName(dto.getCategoryName());
            setup.setSubCategory(dto.getSubCategory());
            setup.setDiscountPercentage(dto.getDiscountPercentage());
            setup.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            DiscountSetup savedSetup = discountSetupRepository.save(setup);
            return new BaseResponse(HttpStatus.CREATED.value(), "Discount setup created successfully", savedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating discount setup: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllDiscountSetups() {
        List<DiscountSetup> setups = discountSetupRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Discount setups retrieved successfully", setups);
    }

    public BaseResponse getActiveDiscountSetups() {
        List<DiscountSetup> setups = discountSetupRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active discount setups retrieved successfully", setups);
    }

    public BaseResponse getDiscountSetupById(Long id) {
        DiscountSetup setup = discountSetupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount setup not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Discount setup retrieved successfully", setup);
    }

    @Transactional
    public BaseResponse updateDiscountSetup(Long id, DiscountSetupDto dto) {
        try {
            DiscountSetup setup = discountSetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Discount setup not found"));

            if (dto.getCategoryName() != null) {
                setup.setCategoryName(dto.getCategoryName());
            }
            if (dto.getSubCategory() != null) {
                setup.setSubCategory(dto.getSubCategory());
            }
            if (dto.getDiscountPercentage() != null) {
                setup.setDiscountPercentage(dto.getDiscountPercentage());
            }
            if (dto.getIsActive() != null) {
                setup.setIsActive(dto.getIsActive());
            }

            DiscountSetup updatedSetup = discountSetupRepository.save(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Discount setup updated successfully", updatedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating discount setup: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteDiscountSetup(Long id) {
        try {
            DiscountSetup setup = discountSetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Discount setup not found"));
            discountSetupRepository.delete(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Discount setup deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting discount setup: " + e.getMessage(), null);
        }
    }
}

package com.appGate.account.service;

import com.appGate.account.dto.DeliverySetupDto;
import com.appGate.account.models.DeliverySetup;
import com.appGate.account.repository.DeliverySetupRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.inventory.models.Category;
import com.appGate.inventory.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliverySetupService {

    private final DeliverySetupRepository deliverySetupRepository;
    private final CategoryRepository categoryRepository;

    private Category resolveCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @Transactional
    public BaseResponse createDeliverySetup(DeliverySetupDto dto) {
        try {
            Category category = resolveCategory(dto.getCategoryId());

            DeliverySetup setup = new DeliverySetup();
            setup.setCategoryId(category.getId());
            setup.setCategoryName(category.getName());
            setup.setWeightMinKg(dto.getWeightMinKg());
            setup.setWeightMaxKg(dto.getWeightMaxKg());
            setup.setDistanceMinKm(dto.getDistanceMinKm());
            setup.setDistanceMaxKm(dto.getDistanceMaxKm());
            setup.setDeliveryFee(dto.getDeliveryFee());
            setup.setAccountToCredit(dto.getAccountToCredit());
            setup.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

            DeliverySetup savedSetup = deliverySetupRepository.save(setup);
            return new BaseResponse(HttpStatus.CREATED.value(), "Delivery setup created successfully", savedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating delivery setup: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllDeliverySetups() {
        List<DeliverySetup> setups = deliverySetupRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Delivery setups retrieved successfully", setups);
    }

    public BaseResponse getActiveDeliverySetups() {
        List<DeliverySetup> setups = deliverySetupRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active delivery setups retrieved successfully", setups);
    }

    public BaseResponse getDeliverySetupById(Long id) {
        DeliverySetup setup = deliverySetupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery setup not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Delivery setup retrieved successfully", setup);
    }

    @Transactional
    public BaseResponse updateDeliverySetup(Long id, DeliverySetupDto dto) {
        try {
            DeliverySetup setup = deliverySetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Delivery setup not found"));

            if (dto.getCategoryId() != null) {
                Category category = resolveCategory(dto.getCategoryId());
                setup.setCategoryId(category.getId());
                setup.setCategoryName(category.getName());
            }
            if (dto.getWeightMinKg() != null) {
                setup.setWeightMinKg(dto.getWeightMinKg());
            }
            // weightMaxKg is intentionally nullable (unbounded tier), so always overwrite it.
            setup.setWeightMaxKg(dto.getWeightMaxKg());
            if (dto.getDistanceMinKm() != null) {
                setup.setDistanceMinKm(dto.getDistanceMinKm());
            }
            // distanceMaxKm is intentionally nullable (unbounded tier), so always overwrite it.
            setup.setDistanceMaxKm(dto.getDistanceMaxKm());
            if (dto.getDeliveryFee() != null) {
                setup.setDeliveryFee(dto.getDeliveryFee());
            }
            if (dto.getAccountToCredit() != null) {
                setup.setAccountToCredit(dto.getAccountToCredit());
            }
            if (dto.getIsActive() != null) {
                setup.setIsActive(dto.getIsActive());
            }

            DeliverySetup updatedSetup = deliverySetupRepository.save(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Delivery setup updated successfully", updatedSetup);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating delivery setup: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteDeliverySetup(Long id) {
        try {
            DeliverySetup setup = deliverySetupRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Delivery setup not found"));
            deliverySetupRepository.delete(setup);
            return new BaseResponse(HttpStatus.OK.value(), "Delivery setup deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting delivery setup: " + e.getMessage(), null);
        }
    }
}

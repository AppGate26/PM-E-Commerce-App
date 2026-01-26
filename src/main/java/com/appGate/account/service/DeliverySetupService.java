package com.appGate.account.service;

import com.appGate.account.dto.DeliverySetupDto;
import com.appGate.account.models.DeliverySetup;
import com.appGate.account.repository.DeliverySetupRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliverySetupService {

    private final DeliverySetupRepository deliverySetupRepository;

    @Transactional
    public BaseResponse createDeliverySetup(DeliverySetupDto dto) {
        try {
            DeliverySetup setup = new DeliverySetup();
            setup.setCategoryName(dto.getCategoryName());
            setup.setWeightKgGram(dto.getWeightKgGram());
            setup.setDistanceKm(dto.getDistanceKm());
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

            if (dto.getCategoryName() != null) {
                setup.setCategoryName(dto.getCategoryName());
            }
            if (dto.getWeightKgGram() != null) {
                setup.setWeightKgGram(dto.getWeightKgGram());
            }
            if (dto.getDistanceKm() != null) {
                setup.setDistanceKm(dto.getDistanceKm());
            }
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

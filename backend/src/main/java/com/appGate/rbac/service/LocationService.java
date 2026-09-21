package com.appGate.rbac.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import com.appGate.rbac.models.State;
import com.appGate.inventory.models.Category;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;

import com.appGate.rbac.response.BaseResponse;

import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.WardRepository;

@Service
public class LocationService {

    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;

    private static final String SUCCESSFUL = "successful";

    public LocationService(StateRepository stateRepository, LGARepository lgaRepository,
            WardRepository wardRepository) {
        this.stateRepository = stateRepository;
        this.lgaRepository = lgaRepository;
        this.wardRepository = wardRepository;
    }

    public BaseResponse getAllStates() {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            stateRepository.findAll());
    }

    public BaseResponse getStateById(Long id) {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            stateRepository.findById(id).orElse(null));
    }

    public BaseResponse getAllLGAs() {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            lgaRepository.findAll());
    }

    public BaseResponse getLGAById(Long id) {
        return new BaseResponse(
            HttpStatus.OK.value(), 
            SUCCESSFUL, 
            lgaRepository.findById(id).orElse(null));
    }

    public BaseResponse getLGAsByStateId(Long stateId) {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            lgaRepository.findAllByStateId(stateId));
    }

    public BaseResponse getAllWards() {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            wardRepository.findAll());
    }

    public BaseResponse getWardById(Long id) {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            wardRepository.findById(id).orElse(null));
    }

    public BaseResponse getWardsByLGAId(Long lgaId) {
        return new BaseResponse(
            HttpStatus.OK.value(),
            SUCCESSFUL,
            wardRepository.findAllByLgaId(lgaId));
    }
}

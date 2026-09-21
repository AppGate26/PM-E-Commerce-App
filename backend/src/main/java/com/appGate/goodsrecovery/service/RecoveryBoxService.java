package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.dto.RecoveryBoxDto;
import com.appGate.goodsrecovery.dto.UpdateRecoveryBoxStatusDto;
import com.appGate.goodsrecovery.enums.RecoveryBoxStatusEnum;
import com.appGate.goodsrecovery.models.GoodsRecovery;
import com.appGate.goodsrecovery.models.RecoveryAgent;
import com.appGate.goodsrecovery.models.RecoveryBox;
import com.appGate.goodsrecovery.repository.GoodsRecoveryRepository;
import com.appGate.goodsrecovery.repository.RecoveryAgentRepository;
import com.appGate.goodsrecovery.repository.RecoveryBoxRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecoveryBoxService {

    private final RecoveryBoxRepository recoveryBoxRepository;
    private final GoodsRecoveryRepository goodsRecoveryRepository;
    private final RecoveryAgentRepository recoveryAgentRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public RecoveryBoxService(RecoveryBoxRepository recoveryBoxRepository,
                              GoodsRecoveryRepository goodsRecoveryRepository,
                              RecoveryAgentRepository recoveryAgentRepository,
                              com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.recoveryBoxRepository = recoveryBoxRepository;
        this.goodsRecoveryRepository = goodsRecoveryRepository;
        this.recoveryAgentRepository = recoveryAgentRepository;
        this.branchScopeService = branchScopeService;
    }

    @Transactional
    public BaseResponse createRecoveryBox(RecoveryBoxDto dto) {
        GoodsRecovery goodsRecovery = goodsRecoveryRepository.findById(dto.getGoodsRecoveryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goods recovery not found"));
        branchScopeService.assertCanAccess(goodsRecovery.getBranchId());

        RecoveryBox recoveryBox = new RecoveryBox();
        recoveryBox.setGoodsRecoveryId(dto.getGoodsRecoveryId());
        recoveryBox.setRecoveryAgentId(dto.getRecoveryAgentId());
        recoveryBox.setCustomerId(goodsRecovery.getCustomerId());
        recoveryBox.setCustomerName(dto.getCustomerName());
        recoveryBox.setCustomerAddress(dto.getCustomerAddress());
        recoveryBox.setItemsToRecover(dto.getItemsToRecover());
        recoveryBox.setNotes(dto.getNotes());
        recoveryBox.setStatus(RecoveryBoxStatusEnum.PENDING);

        RecoveryBox saved = recoveryBoxRepository.save(recoveryBox);
        return new BaseResponse(HttpStatus.CREATED.value(), "Recovery box created successfully", saved);
    }

    public BaseResponse getAllRecoveryBoxes() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<RecoveryBox> boxes = branchId == null
                ? recoveryBoxRepository.findAll()
                : recoveryBoxRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", boxes);
    }

    public BaseResponse getRecoveryBoxById(Long id) {
        RecoveryBox recoveryBox = getRecoveryBox(id);
        return new BaseResponse(HttpStatus.OK.value(), "successful", recoveryBox);
    }

    @Transactional
    public BaseResponse updateRecoveryBoxStatus(Long id, UpdateRecoveryBoxStatusDto dto) {
        RecoveryBox recoveryBox = getRecoveryBox(id);

        recoveryBox.setStatus(dto.getStatus());
        if (dto.getNotes() != null) {
            recoveryBox.setNotes(dto.getNotes());
        }
        if (dto.getItemsRecovered() != null) {
            recoveryBox.setItemsRecovered(dto.getItemsRecovered());
        }

        RecoveryBox updated = recoveryBoxRepository.save(recoveryBox);
        return new BaseResponse(HttpStatus.OK.value(), "Recovery box status updated successfully", updated);
    }

    public BaseResponse deleteRecoveryBox(Long id) {
        RecoveryBox recoveryBox = getRecoveryBox(id);

        if (recoveryBox.getStatus() == RecoveryBoxStatusEnum.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot delete recovery box that has been accepted. Please reject it first.");
        }

        recoveryBoxRepository.delete(recoveryBox);
        return new BaseResponse(HttpStatus.OK.value(), "Recovery box deleted successfully", null);
    }

    public BaseResponse getRecoveryBoxesByAgent(Long recoveryAgentId) {
        RecoveryAgent agent = recoveryAgentRepository.findById(recoveryAgentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery agent not found"));
        branchScopeService.assertCanAccess(agent.getBranchId());

        List<RecoveryBox> boxes = recoveryBoxRepository.findByRecoveryAgentId(recoveryAgentId);

        Map<String, Object> response = new HashMap<>();
        response.put("recoveryAgentId", recoveryAgentId);
        response.put("agentName", agent.getFirstName() + " " + agent.getLastName());
        response.put("totalBoxes", boxes.size());
        response.put("boxes", boxes);

        return new BaseResponse(HttpStatus.OK.value(), "Recovery boxes retrieved successfully", response);
    }

    /** The single seam every box read/write goes through. */
    private RecoveryBox getRecoveryBox(Long id) {
        RecoveryBox box = recoveryBoxRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery box not found"));
        branchScopeService.assertCanAccess(box.getBranchId());
        return box;
    }
}

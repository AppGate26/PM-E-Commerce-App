package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.dto.RecoveryBoxDto;
import com.appGate.goodsrecovery.dto.UpdateRecoveryBoxStatusDto;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.RecoveryBoxService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/recovery-box")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class RecoveryBoxController {

    private final RecoveryBoxService recoveryBoxService;

    public RecoveryBoxController(RecoveryBoxService recoveryBoxService) {
        this.recoveryBoxService = recoveryBoxService;
    }

    @PostMapping
    public BaseResponse createRecoveryBox(@Valid @RequestBody RecoveryBoxDto dto) {
        return recoveryBoxService.createRecoveryBox(dto);
    }

    @GetMapping
    public BaseResponse getAllRecoveryBoxes() {
        return recoveryBoxService.getAllRecoveryBoxes();
    }

    @GetMapping("/{id}")
    public BaseResponse getRecoveryBoxById(@PathVariable Long id) {
        return recoveryBoxService.getRecoveryBoxById(id);
    }

    @PutMapping("/{id}/status")
    public BaseResponse updateRecoveryBoxStatus(@PathVariable Long id, @Valid @RequestBody UpdateRecoveryBoxStatusDto dto) {
        return recoveryBoxService.updateRecoveryBoxStatus(id, dto);
    }

    @DeleteMapping("/{id}")
    public BaseResponse deleteRecoveryBox(@PathVariable Long id) {
        return recoveryBoxService.deleteRecoveryBox(id);
    }

    @GetMapping("/agent/{recoveryAgentId}")
    public BaseResponse getRecoveryBoxesByAgent(@PathVariable Long recoveryAgentId) {
        return recoveryBoxService.getRecoveryBoxesByAgent(recoveryAgentId);
    }
}

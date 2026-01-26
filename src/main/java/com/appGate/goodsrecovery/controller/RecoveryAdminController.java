package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.dto.RecoveryAgentDto;
import com.appGate.goodsrecovery.dto.SuspendRecoveryAgentDto;
import com.appGate.goodsrecovery.dto.UnsuspendRecoveryAgentDto;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.RecoveryAgentService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class RecoveryAdminController {

    private final RecoveryAgentService recoveryAgentService;

    public RecoveryAdminController(RecoveryAgentService recoveryAgentService) {
        this.recoveryAgentService = recoveryAgentService;
    }

    @PostMapping(value = "/create-recovery-agent", consumes = "multipart/form-data")
    public BaseResponse createRecoveryAgent(@ModelAttribute RecoveryAgentDto recoveryAgentDto, HttpServletRequest request) {
        return recoveryAgentService.createRecoveryAgent(recoveryAgentDto, request);
    }

    @GetMapping("/recovery-agents")
    public BaseResponse getAllRecoveryAgents() {
        return recoveryAgentService.getAllRecoveryAgents();
    }

    @GetMapping("/recovery-agents/{id}")
    public BaseResponse getRecoveryAgentById(@PathVariable Long id) {
        return recoveryAgentService.getRecoveryAgentById(id);
    }

    @PutMapping(value = "/recovery-agents/{id}", consumes = "multipart/form-data")
    public BaseResponse updateRecoveryAgent(@PathVariable Long id, @ModelAttribute RecoveryAgentDto recoveryAgentDto, HttpServletRequest request) {
        return recoveryAgentService.updateRecoveryAgent(id, recoveryAgentDto, request);
    }

    @DeleteMapping("/recovery-agents/{id}")
    public BaseResponse deleteRecoveryAgent(@PathVariable Long id) {
        return recoveryAgentService.deleteRecoveryAgent(id);
    }

    @PutMapping("/recovery-agents/{id}/suspend")
    public BaseResponse suspendRecoveryAgent(@PathVariable Long id, @Valid @RequestBody SuspendRecoveryAgentDto suspendDto) {
        return recoveryAgentService.suspendRecoveryAgent(id, suspendDto);
    }

    @PutMapping("/recovery-agents/{id}/unsuspend")
    public BaseResponse unsuspendRecoveryAgent(@PathVariable Long id, @Valid @RequestBody UnsuspendRecoveryAgentDto unsuspendDto) {
        return recoveryAgentService.unsuspendRecoveryAgent(id, unsuspendDto);
    }

    @GetMapping("/recovery-agents/suspended")
    public BaseResponse getSuspendedRecoveryAgents() {
        return recoveryAgentService.getSuspendedRecoveryAgents();
    }

    @GetMapping("/recovery-agents/search")
    public BaseResponse searchRecoveryAgents(@RequestParam String searchTerm) {
        return recoveryAgentService.searchRecoveryAgents(searchTerm);
    }

}

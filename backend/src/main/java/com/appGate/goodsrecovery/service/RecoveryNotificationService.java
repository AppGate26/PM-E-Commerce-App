package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.models.RecoveryNotification;
import com.appGate.goodsrecovery.repository.RecoveryNotificationRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecoveryNotificationService {

    private final RecoveryNotificationRepository recoveryNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public RecoveryNotificationService(RecoveryNotificationRepository recoveryNotificationRepository,
                                       com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.recoveryNotificationRepository = recoveryNotificationRepository;
        this.branchScopeService = branchScopeService;
    }

    public BaseResponse getAllNotifications() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branchId == null
                ? recoveryNotificationRepository.findAll()
                : recoveryNotificationRepository.findByBranchId(branchId));
    }

    public BaseResponse getNotificationById(Long id) {
        RecoveryNotification notification = recoveryNotificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        branchScopeService.assertCanAccess(notification.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "successful", notification);
    }

    public BaseResponse getNotificationsByAgent(Long recoveryAgentId) {
        // Filtered in memory: one agent's list is short by construction.
        Long branchId = branchScopeService.getScopedBranchId();
        java.util.List<RecoveryNotification> rows =
                recoveryNotificationRepository.findByRecoveryAgentIdOrderByNotificationDateDesc(recoveryAgentId);
        if (branchId != null) {
            rows = rows.stream()
                    .filter(n -> branchId.equals(n.getBranchId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return new BaseResponse(HttpStatus.OK.value(), "successful", rows);
    }

    public BaseResponse getUnreadNotifications() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branchId == null
                ? recoveryNotificationRepository.findByIsRead(false)
                : recoveryNotificationRepository.findByIsReadAndBranchId(false, branchId));
    }
}

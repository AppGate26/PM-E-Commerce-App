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

    public RecoveryNotificationService(RecoveryNotificationRepository recoveryNotificationRepository) {
        this.recoveryNotificationRepository = recoveryNotificationRepository;
    }

    public BaseResponse getAllNotifications() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", recoveryNotificationRepository.findAll());
    }

    public BaseResponse getNotificationById(Long id) {
        RecoveryNotification notification = recoveryNotificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        return new BaseResponse(HttpStatus.OK.value(), "successful", notification);
    }

    public BaseResponse getNotificationsByAgent(Long recoveryAgentId) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                recoveryNotificationRepository.findByRecoveryAgentIdOrderByNotificationDateDesc(recoveryAgentId));
    }

    public BaseResponse getUnreadNotifications() {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                recoveryNotificationRepository.findByIsRead(false));
    }
}

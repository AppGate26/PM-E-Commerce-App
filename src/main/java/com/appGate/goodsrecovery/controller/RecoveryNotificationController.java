package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.RecoveryNotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/recovery-notifications")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class RecoveryNotificationController {

    private final RecoveryNotificationService recoveryNotificationService;

    public RecoveryNotificationController(RecoveryNotificationService recoveryNotificationService) {
        this.recoveryNotificationService = recoveryNotificationService;
    }

    @GetMapping
    public BaseResponse getAllNotifications() {
        return recoveryNotificationService.getAllNotifications();
    }

    @GetMapping("/{id}")
    public BaseResponse getNotificationById(@PathVariable Long id) {
        return recoveryNotificationService.getNotificationById(id);
    }

    @GetMapping("/agent/{recoveryAgentId}")
    public BaseResponse getNotificationsByAgent(@PathVariable Long recoveryAgentId) {
        return recoveryNotificationService.getNotificationsByAgent(recoveryAgentId);
    }

    @GetMapping("/unread")
    public BaseResponse getUnreadNotifications() {
        return recoveryNotificationService.getUnreadNotifications();
    }
}

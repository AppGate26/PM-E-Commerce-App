package com.appGate.account.controller;

import com.appGate.account.dto.CreateNotificationDto;
import com.appGate.account.service.RealTimeNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketController {

    private final RealTimeNotificationService realTimeNotificationService;

    /**
     * Handle subscription to user's personal notification queue
     */
    @SubscribeMapping("/queue/notifications")
    public String subscribeToNotifications(Principal principal) {
        String userId = principal.getName();
        log.info("User {} subscribed to notifications", userId);
        return "Connected to notifications";
    }

    /**
     * Handle subscription to care module notifications
     */
    @SubscribeMapping("/queue/care-notifications")
    public String subscribeToCareNotifications(Principal principal) {
        String userId = principal.getName();
        log.info("User {} subscribed to care notifications", userId);
        return "Connected to care notifications";
    }

    /**
     * Handle subscription to broadcast notifications (system alerts, etc.)
     */
    @SubscribeMapping("/topic/notifications")
    public String subscribeToBroadcastNotifications() {
        log.info("User subscribed to broadcast notifications");
        return "Connected to broadcast notifications";
    }

    /**
     * Echo endpoint for testing connectivity
     */
    @MessageMapping("/notifications/ping")
    public void ping() {
        log.debug("Received ping from notification client");
    }

    /**
     * Handle incoming notification requests
     */
    @MessageMapping("/notifications/send")
    public void sendNotification(
            @Payload CreateNotificationDto dto,
            Principal principal) {
        try {
            Long userId = Long.parseLong(principal.getName());
            realTimeNotificationService.sendNotificationToUser(userId, dto);
        } catch (Exception e) {
            log.error("Error sending notification: {}", e.getMessage(), e);
        }
    }
}

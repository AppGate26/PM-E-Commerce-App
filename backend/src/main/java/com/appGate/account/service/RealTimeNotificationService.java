package com.appGate.account.service;

import com.appGate.account.dto.CreateNotificationDto;
import com.appGate.account.enums.NotificationType;
import com.appGate.account.models.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    /**
     * Send real-time notification to a specific user via WebSocket
     */
    @Transactional
    public void sendNotificationToUser(Long userId, CreateNotificationDto dto) {
        try {
            Notification notification = notificationService.createQuickNotification(
                    userId,
                    dto.getTitle(),
                    dto.getMessage(),
                    dto.getType(),
                    dto.getRelatedEntityId(),
                    dto.getRelatedEntityType()
            );

            Map<String, Object> payload = buildNotificationPayload(notification);

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    payload
            );

            log.info("Real-time notification sent to user {}: {}", userId, notification.getTitle());
        } catch (Exception e) {
            log.error("Failed to send real-time notification to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Broadcast notification to all connected users (for system alerts, etc.)
     */
    public void broadcastNotification(String message, NotificationType type) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", type);
            payload.put("message", message);
            payload.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/notifications", payload);

            log.info("Broadcast notification sent: {}", message);
        } catch (Exception e) {
            log.error("Failed to broadcast notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send care module specific notification
     */
    @Transactional
    public void sendCareNotification(Long userId, String title, String message,
                                     NotificationType type, Long relatedEntityId) {
        try {
            Notification notification = notificationService.createQuickNotification(
                    userId,
                    title,
                    message,
                    type,
                    relatedEntityId,
                    "CALL"
            );

            Map<String, Object> payload = buildCareNotificationPayload(notification);

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/care-notifications",
                    payload
            );

            log.info("Care notification sent to user {}: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to send care notification to user {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Send incoming call notification (priority)
     */
    @Transactional
    public void sendIncomingCallNotification(Long userId, String callerName, String callerPhone,
                                            Long callId) {
        try {
            String title = "Incoming Call";
            String message = callerName + " (" + callerPhone + ") is calling...";

            Notification notification = notificationService.createQuickNotification(
                    userId,
                    title,
                    message,
                    NotificationType.INCOMING_CALL,
                    callId,
                    "CALL"
            );

            Map<String, Object> payload = new HashMap<>();
            payload.put("id", notification.getId());
            payload.put("type", "INCOMING_CALL");
            payload.put("title", title);
            payload.put("message", message);
            payload.put("callerId", callerPhone);
            payload.put("callerName", callerName);
            payload.put("callId", callId);
            payload.put("priority", "HIGH");
            payload.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/care-notifications",
                    payload
            );

            log.info("Incoming call notification sent to user {}: {} from {}", userId, callerName, callerPhone);
        } catch (Exception e) {
            log.error("Failed to send incoming call notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send queue update notification
     */
    @Transactional
    public void sendQueueUpdateNotification(Long userId, int queuePosition, int totalInQueue) {
        try {
            String title = "Queue Update";
            String message = "You are at position " + queuePosition + " in queue (" + totalInQueue + " waiting)";

            Notification notification = notificationService.createQuickNotification(
                    userId,
                    title,
                    message,
                    NotificationType.CALL_QUEUE_UPDATE,
                    null,
                    "QUEUE"
            );

            Map<String, Object> payload = new HashMap<>();
            payload.put("id", notification.getId());
            payload.put("type", "QUEUE_UPDATE");
            payload.put("title", title);
            payload.put("message", message);
            payload.put("position", queuePosition);
            payload.put("total", totalInQueue);
            payload.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/care-notifications",
                    payload
            );

            log.debug("Queue update notification sent to user {}: position {}/{}", userId, queuePosition, totalInQueue);
        } catch (Exception e) {
            log.error("Failed to send queue update notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send chat message notification
     */
    @Transactional
    public void sendChatNotification(Long userId, String senderName, String messagePreview, Long chatId) {
        try {
            String title = "New Message";
            String message = senderName + ": " + messagePreview;

            Notification notification = notificationService.createQuickNotification(
                    userId,
                    title,
                    message,
                    NotificationType.CHAT_MESSAGE,
                    chatId,
                    "CHAT"
            );

            Map<String, Object> payload = new HashMap<>();
            payload.put("id", notification.getId());
            payload.put("type", "CHAT_MESSAGE");
            payload.put("title", title);
            payload.put("message", message);
            payload.put("sender", senderName);
            payload.put("chatId", chatId);
            payload.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/care-notifications",
                    payload
            );

            log.debug("Chat notification sent to user {}: {}", userId, senderName);
        } catch (Exception e) {
            log.error("Failed to send chat notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Build notification payload for standard notifications
     */
    private Map<String, Object> buildNotificationPayload(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", notification.getId());
        payload.put("type", notification.getType());
        payload.put("title", notification.getTitle());
        payload.put("message", notification.getMessage());
        payload.put("status", notification.getStatus());
        payload.put("relatedEntityId", notification.getRelatedEntityId());
        payload.put("relatedEntityType", notification.getRelatedEntityType());
        payload.put("actionUrl", notification.getActionUrl());
        payload.put("timestamp", System.currentTimeMillis());
        return payload;
    }

    /**
     * Build notification payload for care module notifications
     */
    private Map<String, Object> buildCareNotificationPayload(Notification notification) {
        Map<String, Object> payload = buildNotificationPayload(notification);
        payload.put("module", "CARE");
        payload.put("priority", "HIGH");
        return payload;
    }
}

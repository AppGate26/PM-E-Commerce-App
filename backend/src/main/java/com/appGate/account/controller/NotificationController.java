package com.appGate.account.controller;

import com.appGate.account.dto.CreateNotificationDto;
import com.appGate.account.enums.NotificationType;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.NotificationService;
import com.appGate.account.service.RealTimeNotificationService;
import com.appGate.account.service.CareNotificationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final RealTimeNotificationService realTimeNotificationService;
    private final CareNotificationHelper careNotificationHelper;

    @PostMapping
    public BaseResponse createNotification(@Valid @RequestBody CreateNotificationDto dto) {
        return notificationService.createNotification(dto);
    }

    @GetMapping("/user/{userId}")
    public BaseResponse getUserNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.getUserNotifications(userId, page, size);
    }

    @GetMapping("/user/{userId}/unread")
    public BaseResponse getUnreadNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.getUnreadNotifications(userId, page, size);
    }

    @GetMapping("/user/{userId}/type/{type}")
    public BaseResponse getNotificationsByType(
            @PathVariable Long userId,
            @PathVariable NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.getNotificationsByType(userId, type, page, size);
    }

    @GetMapping("/user/{userId}/stats")
    public BaseResponse getNotificationStats(@PathVariable Long userId) {
        return notificationService.getNotificationStats(userId);
    }

    @PutMapping("/{notificationId}/read")
    public BaseResponse markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PutMapping("/user/{userId}/read-all")
    public BaseResponse markAllAsRead(@PathVariable Long userId) {
        return notificationService.markAllAsRead(userId);
    }

    @PutMapping("/{notificationId}/archive")
    public BaseResponse archiveNotification(@PathVariable Long notificationId) {
        return notificationService.archiveNotification(notificationId);
    }

    @DeleteMapping("/{notificationId}")
    public BaseResponse deleteNotification(@PathVariable Long notificationId) {
        return notificationService.deleteNotification(notificationId);
    }

    // Care Module Notification Endpoints
    @PostMapping("/care/incoming-call")
    public BaseResponse notifyIncomingCall(
            @RequestParam Long userId,
            @RequestParam String callerName,
            @RequestParam String callerPhone,
            @RequestParam Long callId) {
        careNotificationHelper.notifyIncomingCall(userId, callerName, callerPhone, callId);
        return new BaseResponse(200, "Incoming call notification sent", null);
    }

    @PostMapping("/care/queue-update")
    public BaseResponse notifyQueueUpdate(
            @RequestParam Long userId,
            @RequestParam int position,
            @RequestParam int total) {
        careNotificationHelper.notifyQueueUpdate(userId, position, total);
        return new BaseResponse(200, "Queue update notification sent", null);
    }

    @PostMapping("/care/call-accepted")
    public BaseResponse notifyCallAccepted(
            @RequestParam Long userId,
            @RequestParam String agentName,
            @RequestParam Long callId) {
        careNotificationHelper.notifyCallAccepted(userId, agentName, callId);
        return new BaseResponse(200, "Call accepted notification sent", null);
    }

    @PostMapping("/care/call-declined")
    public BaseResponse notifyCallDeclined(
            @RequestParam Long userId,
            @RequestParam Long callId) {
        careNotificationHelper.notifyCallDeclined(userId, callId);
        return new BaseResponse(200, "Call declined notification sent", null);
    }

    @PostMapping("/care/call-ended")
    public BaseResponse notifyCallEnded(
            @RequestParam Long userId,
            @RequestParam long duration,
            @RequestParam Long callId) {
        careNotificationHelper.notifyCallEnded(userId, duration, callId);
        return new BaseResponse(200, "Call ended notification sent", null);
    }

    @PostMapping("/care/chat-message")
    public BaseResponse notifyChatMessage(
            @RequestParam Long userId,
            @RequestParam String senderName,
            @RequestParam String messagePreview,
            @RequestParam Long chatId) {
        careNotificationHelper.notifyChatMessage(userId, senderName, messagePreview, chatId);
        return new BaseResponse(200, "Chat message notification sent", null);
    }

    @PostMapping("/care/chat-started")
    public BaseResponse notifyChatStarted(
            @RequestParam Long userId,
            @RequestParam String senderName,
            @RequestParam Long chatId) {
        careNotificationHelper.notifyChatStarted(userId, senderName, chatId);
        return new BaseResponse(200, "Chat started notification sent", null);
    }

    @PostMapping("/care/escalation")
    public BaseResponse notifyEscalation(
            @RequestParam Long userId,
            @RequestParam String department,
            @RequestParam Long ticketId) {
        careNotificationHelper.notifyEscalation(userId, department, ticketId);
        return new BaseResponse(200, "Escalation notification sent", null);
    }

    @PostMapping("/care/resolved")
    public BaseResponse notifySupportResolved(
            @RequestParam Long userId,
            @RequestParam Long ticketId) {
        careNotificationHelper.notifySupportResolved(userId, ticketId);
        return new BaseResponse(200, "Support resolved notification sent", null);
    }
}

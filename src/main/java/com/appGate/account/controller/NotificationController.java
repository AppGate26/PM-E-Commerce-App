package com.appGate.account.controller;

import com.appGate.account.dto.CreateNotificationDto;
import com.appGate.account.enums.NotificationType;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

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
}

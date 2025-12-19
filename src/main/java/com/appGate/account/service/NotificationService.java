package com.appGate.account.service;

import com.appGate.account.dto.CreateNotificationDto;
import com.appGate.account.enums.NotificationStatus;
import com.appGate.account.enums.NotificationType;
import com.appGate.account.models.Notification;
import com.appGate.account.repository.NotificationRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public BaseResponse createNotification(CreateNotificationDto dto) {
        try {
            Notification notification = new Notification();
            notification.setUserId(dto.getUserId());
            notification.setTitle(dto.getTitle());
            notification.setMessage(dto.getMessage());
            notification.setType(dto.getType());
            notification.setStatus(NotificationStatus.UNREAD);
            notification.setRelatedEntityId(dto.getRelatedEntityId());
            notification.setRelatedEntityType(dto.getRelatedEntityType());
            notification.setActionUrl(dto.getActionUrl());
            notification.setIsPushSent(dto.getSendPush());
            notification.setIsEmailSent(dto.getSendEmail());
            notification.setIsSmsSent(dto.getSendSms());

            Notification savedNotification = notificationRepository.save(notification);

            // TODO: Send push notification if sendPush is true
            // TODO: Send email if sendEmail is true
            // TODO: Send SMS if sendSms is true

            return new BaseResponse(HttpStatus.CREATED.value(),
                    "Notification created successfully", savedNotification);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to create notification: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserNotifications(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notifications retrieved successfully", notifications);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve notifications: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUnreadNotifications(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Notification> notifications = notificationRepository.findByUserIdAndStatus(
                    userId, NotificationStatus.UNREAD, pageable);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Unread notifications retrieved successfully", notifications);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve unread notifications: " + e.getMessage(), null);
        }
    }

    public BaseResponse getNotificationsByType(Long userId, NotificationType type, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Notification> notifications = notificationRepository.findByUserIdAndType(
                    userId, type, pageable);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notifications retrieved successfully", notifications);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve notifications: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse markAsRead(Long notificationId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now());

            Notification updatedNotification = notificationRepository.save(notification);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notification marked as read", updatedNotification);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to mark notification as read: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse markAllAsRead(Long userId) {
        try {
            notificationRepository.updateStatusByUserIdAndCurrentStatus(
                    userId, NotificationStatus.UNREAD, NotificationStatus.READ);

            return new BaseResponse(HttpStatus.OK.value(),
                    "All notifications marked as read", null);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to mark notifications as read: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse archiveNotification(Long notificationId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            notification.setStatus(NotificationStatus.ARCHIVED);

            Notification updatedNotification = notificationRepository.save(notification);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notification archived", updatedNotification);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to archive notification: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteNotification(Long notificationId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            notificationRepository.delete(notification);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notification deleted successfully", null);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to delete notification: " + e.getMessage(), null);
        }
    }

    public BaseResponse getNotificationStats(Long userId) {
        try {
            Long totalNotifications = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD)
                    + notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.READ);
            Long unreadCount = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
            Long readCount = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.READ);

            // Get recent notifications (last 24 hours)
            LocalDateTime last24Hours = LocalDateTime.now().minusDays(1);
            List<Notification> recentNotifications = notificationRepository.findByUserIdAndCreatedAtAfter(
                    userId, last24Hours);

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalNotifications", totalNotifications);
            stats.put("unreadCount", unreadCount);
            stats.put("readCount", readCount);
            stats.put("recentCount", recentNotifications.size());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Notification statistics retrieved successfully", stats);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve notification statistics: " + e.getMessage(), null);
        }
    }

    // Helper method to create quick notifications (can be called from other services)
    @Transactional
    public Notification createQuickNotification(Long userId, String title, String message,
                                               NotificationType type, Long relatedEntityId,
                                               String relatedEntityType) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setIsPushSent(false);
        notification.setIsEmailSent(false);
        notification.setIsSmsSent(false);

        return notificationRepository.save(notification);
    }
}

package com.appGate.delivery.service;

import com.appGate.delivery.dto.DeliveryNotificationDto;
import com.appGate.delivery.models.DeliveryNotification;
import com.appGate.delivery.repository.DeliveryNotificationRepository;
import com.appGate.delivery.response.BaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DeliveryNotificationService {

    private final DeliveryNotificationRepository deliveryNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    public DeliveryNotificationService(DeliveryNotificationRepository deliveryNotificationRepository,
                                       com.appGate.rbac.service.BranchScopeService branchScopeService) {
        this.deliveryNotificationRepository = deliveryNotificationRepository;
        this.branchScopeService = branchScopeService;
    }

    /** Load a notification, refusing one that belongs to another branch. */
    private DeliveryNotification notificationInScope(Long id) {
        DeliveryNotification notification = deliveryNotificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        branchScopeService.assertCanAccess(notification.getBranchId());
        return notification;
    }

    public BaseResponse getAllNotifications(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Long branchId = branchScopeService.getScopedBranchId();
        Page<DeliveryNotification> notifications = branchId == null
                ? deliveryNotificationRepository.findAllByOrderByNotificationDateDesc(pageable)
                : deliveryNotificationRepository.findByBranchIdOrderByNotificationDateDesc(branchId, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", notifications.getContent());
        response.put("totalPages", notifications.getTotalPages());
        response.put("totalElements", notifications.getTotalElements());
        response.put("currentPage", notifications.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Notifications retrieved successfully", response);
    }

    public BaseResponse createNotification(DeliveryNotificationDto dto) {
        DeliveryNotification notification = new DeliveryNotification();
        notification.setOrderId(dto.getOrderId());
        notification.setRiderId(dto.getRiderId());
        notification.setCustomerName(dto.getCustomerName());
        notification.setProductName(dto.getProductName());
        notification.setDeliveryAddress(dto.getDeliveryAddress());
        notification.setNotificationType(dto.getNotificationType());
        notification.setMessage(dto.getMessage());
        notification.setNotificationDate(dto.getNotificationDate() != null ? dto.getNotificationDate() : LocalDateTime.now());
        notification.setIsRead(false);

        DeliveryNotification saved = deliveryNotificationRepository.save(notification);

        return new BaseResponse(HttpStatus.CREATED.value(), "Notification created successfully", saved);
    }

    public BaseResponse getNotificationById(Long id) {
        DeliveryNotification notification = notificationInScope(id);

        return new BaseResponse(HttpStatus.OK.value(), "Notification retrieved successfully", notification);
    }

    public BaseResponse markAsRead(Long id) {
        DeliveryNotification notification = notificationInScope(id);

        notification.setIsRead(true);
        deliveryNotificationRepository.save(notification);

        return new BaseResponse(HttpStatus.OK.value(), "Notification marked as read", notification);
    }
}

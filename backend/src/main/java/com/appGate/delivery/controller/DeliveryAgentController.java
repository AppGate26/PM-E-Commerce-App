package com.appGate.delivery.controller;

import com.appGate.delivery.dto.DeliveryConfirmationDto;
import com.appGate.delivery.dto.DeliveryFeedbackDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.DeliveryNotificationService;
import com.appGate.delivery.service.DeliveryOperationsService;
import com.appGate.delivery.service.RiderChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery-agent")
@Tag(name = "Delivery Agent Operations", description = "Delivery agent authentication and delivery operations")
public class DeliveryAgentController {

    private final DeliveryOperationsService deliveryOperationsService;
    private final DeliveryNotificationService deliveryNotificationService;
    private final RiderChatService riderChatService;

    public DeliveryAgentController(DeliveryOperationsService deliveryOperationsService,
                                   DeliveryNotificationService deliveryNotificationService,
                                   RiderChatService riderChatService) {
        this.deliveryOperationsService = deliveryOperationsService;
        this.deliveryNotificationService = deliveryNotificationService;
        this.riderChatService = riderChatService;
    }

    @GetMapping("/pending-deliveries/{riderId}")
    public BaseResponse getPendingDeliveries(
            @PathVariable Long riderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deliveryOperationsService.getPendingDeliveries(riderId, page, size);
    }

    @GetMapping("/delivery/{riderBoxId}")
    public BaseResponse getDeliveryDetails(@PathVariable Long riderBoxId) {
        return deliveryOperationsService.getDeliveryDetails(riderBoxId);
    }

    // Rider is leaving with the item - moves the delivery to IN_TRANSIT.
    @PutMapping("/start-delivery/{riderBoxId}")
    public BaseResponse startDelivery(@PathVariable Long riderBoxId) {
        return deliveryOperationsService.startDelivery(riderBoxId);
    }

    @PostMapping(value = "/confirm-delivery", consumes = "multipart/form-data")
    public BaseResponse confirmDelivery(
            @ModelAttribute @Valid DeliveryConfirmationDto dto,
            HttpServletRequest request) {
        return deliveryOperationsService.confirmDelivery(dto, request);
    }

    @PostMapping("/submit-feedback")
    public BaseResponse submitFeedback(@Valid @RequestBody DeliveryFeedbackDto dto) {
        return deliveryOperationsService.submitFeedback(dto);
    }

    @GetMapping("/history/{riderId}")
    public BaseResponse getDeliveryHistory(
            @PathVariable Long riderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        return deliveryOperationsService.getDeliveryHistory(riderId, startDate, endDate, search, page, size, sortBy);
    }

    // ==================== NOTIFICATIONS ====================

    @GetMapping("/notifications/{riderId}")
    public BaseResponse getNotifications(
            @PathVariable Long riderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return deliveryNotificationService.getRiderNotifications(riderId, page, size);
    }

    @GetMapping("/notifications/{riderId}/unread-count")
    public BaseResponse getUnreadNotificationCount(@PathVariable Long riderId) {
        return deliveryNotificationService.getRiderUnreadCount(riderId);
    }

    @PutMapping("/notifications/{riderId}/{notificationId}/read")
    public BaseResponse markNotificationRead(@PathVariable Long riderId, @PathVariable Long notificationId) {
        return deliveryNotificationService.markRiderNotificationRead(riderId, notificationId);
    }

    @PutMapping("/notifications/{riderId}/read-all")
    public BaseResponse markAllNotificationsRead(@PathVariable Long riderId) {
        return deliveryNotificationService.markAllRiderNotificationsRead(riderId);
    }

    // ==================== CHAT (rider <-> dispatch) ====================
    // The rider is taken from the login token, not the path - see RiderChatService.

    @GetMapping("/chat/contacts")
    public BaseResponse getChatContacts() {
        return riderChatService.getContacts();
    }

    @GetMapping("/chat/messages/{contactUserId}")
    public BaseResponse getChatMessages(@PathVariable Long contactUserId) {
        return riderChatService.getMessages(contactUserId);
    }

    @PostMapping("/chat/messages/{contactUserId}")
    public BaseResponse sendChatMessage(@PathVariable Long contactUserId, @RequestBody Map<String, String> body) {
        return riderChatService.sendMessage(contactUserId, body.get("message"));
    }

    @GetMapping("/chat/unread-count")
    public BaseResponse getChatUnreadCount() {
        return riderChatService.getUnreadCount();
    }
}

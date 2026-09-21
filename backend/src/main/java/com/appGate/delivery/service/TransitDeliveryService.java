package com.appGate.delivery.service;

import com.appGate.delivery.models.DeliveryNotification;
import com.appGate.delivery.repository.DeliveryNotificationRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.service.MobileSalesOrderSyncService;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransitDeliveryService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryNotificationRepository deliveryNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;

    public TransitDeliveryService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            DeliveryNotificationRepository deliveryNotificationRepository,
            com.appGate.rbac.service.BranchScopeService branchScopeService,
            MobileSalesOrderSyncService mobileSalesOrderSyncService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.deliveryNotificationRepository = deliveryNotificationRepository;
        this.branchScopeService = branchScopeService;
        this.mobileSalesOrderSyncService = mobileSalesOrderSyncService;
    }

    /** Load an order, refusing one that belongs to another branch. */
    private Order orderInScope(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        branchScopeService.assertCanAccess(order.getBranchId());
        return order;
    }

    public BaseResponse getAllTransitDeliveries(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());

        // Get orders that are in transit or shipped
        Long branchId = branchScopeService.getScopedBranchId();
        List<DeliveryStatus> statuses = List.of(DeliveryStatus.IN_TRANSIT);
        Page<Order> transitOrders = branchId == null
                ? orderRepository.findByDeliveryStatusIn(statuses, pageable)
                : orderRepository.findByBranchIdAndDeliveryStatusIn(branchId, statuses, pageable);

        List<Map<String, Object>> deliveries = transitOrders.getContent().stream()
                .map(this::mapToTransitDeliveryDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", deliveries);
        response.put("totalPages", transitOrders.getTotalPages());
        response.put("totalElements", transitOrders.getTotalElements());
        response.put("currentPage", transitOrders.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Transit deliveries retrieved successfully", response);
    }

    @Transactional
    public BaseResponse markAsDelivered(Long orderId) {
        Order order = orderInScope(orderId);

        if (order.getDeliveryStatus() != DeliveryStatus.IN_TRANSIT && order.getDeliveryStatus() != DeliveryStatus.PICKED_UP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not in transit");
        }

        // Update the order's status and mirror it onto the admin-facing SalesOrder -
        // see MobileSalesOrderSyncService.markOrderDelivered.
        mobileSalesOrderSyncService.markOrderDelivered(order.getId());

        // Create notification
        createDeliveryNotification(order, "DELIVERED", "Order has been delivered successfully");

        return new BaseResponse(HttpStatus.OK.value(), "Order marked as delivered successfully",
                com.appGate.orderingsales.dto.OrderDto.from(order));
    }

    public BaseResponse getDeliveryStatus(Long orderId) {
        Order order = orderInScope(orderId);

        Map<String, Object> statusInfo = new HashMap<>();
        statusInfo.put("orderId", order.getId());
        statusInfo.put("orderNumber", order.getOrderNumber());
        statusInfo.put("deliveryStatus", order.getDeliveryStatus());
        statusInfo.put("deliveryAddress", order.getDeliveryAddress());
        statusInfo.put("shippedAt", order.getShippedAt());
        statusInfo.put("deliveredAt", order.getDeliveredAt());
        statusInfo.put("riderId", order.getRiderId());

        // Get customer info
        User customer = userRepository.findById(order.getUserId()).orElse(null);
        if (customer != null) {
            statusInfo.put("customerName", customer.getFirstName() + " " + customer.getLastName());
            statusInfo.put("customerPhone", order.getDeliveryPhone());
        }

        return new BaseResponse(HttpStatus.OK.value(), "Delivery status retrieved successfully", statusInfo);
    }

    private Map<String, Object> mapToTransitDeliveryDto(Order order) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("orderId", order.getId());
        dto.put("orderNumber", order.getOrderNumber());
        dto.put("deliveryStatus", order.getDeliveryStatus().name());
        dto.put("deliveryAddress", order.getDeliveryAddress());
        dto.put("totalAmount", order.getGrandTotal());
        dto.put("shippedAt", order.getShippedAt());
        dto.put("riderId", order.getRiderId());

        // Get customer info
        User customer = userRepository.findById(order.getUserId()).orElse(null);
        if (customer != null) {
            dto.put("customerName", customer.getFirstName() + " " + customer.getLastName());
            dto.put("customerPhone", order.getDeliveryPhone());
        }

        return dto;
    }

    private void createDeliveryNotification(Order order, String type, String message) {
        DeliveryNotification notification = new DeliveryNotification();
        notification.setOrderId(order.getId());
        notification.setRiderId(order.getRiderId());
        notification.setNotificationType(type);
        notification.setMessage(message);
        notification.setDeliveryAddress(order.getDeliveryAddress());
        notification.setNotificationDate(LocalDateTime.now());

        // Get customer and product names
        User customer = userRepository.findById(order.getUserId()).orElse(null);
        if (customer != null) {
            notification.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
        }

        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            notification.setProductName(order.getOrderItems().get(0).getProductName());
        }

        deliveryNotificationRepository.save(notification);
    }
}

package com.appGate.delivery.service;

import com.appGate.delivery.dto.PendingDeliveryDto;
import com.appGate.delivery.dto.PendingDeliveryItemDto;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.DeliveryNotification;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.DeliveryNotificationRepository;
import com.appGate.delivery.repository.RiderBoxRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransitDeliveryService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryNotificationRepository deliveryNotificationRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;
    private final RiderBoxRepository riderBoxRepository;
    private final RiderBoxDetailsResolver detailsResolver;

    public TransitDeliveryService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            DeliveryNotificationRepository deliveryNotificationRepository,
            com.appGate.rbac.service.BranchScopeService branchScopeService,
            MobileSalesOrderSyncService mobileSalesOrderSyncService,
            RiderBoxRepository riderBoxRepository,
            RiderBoxDetailsResolver detailsResolver) {
        this.riderBoxRepository = riderBoxRepository;
        this.detailsResolver = detailsResolver;
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

    /**
     * Everything currently on the road. Mostly that's rider boxes the rider has started
     * (RiderBox IN_TRANSIT - see DeliveryOperationsService.startDelivery), which also covers
     * walk-in sales that have no mobile Order. Orders put in transit by the admin SHIPPED
     * status update without any rider trip behind them are still listed too.
     */
    public BaseResponse getAllTransitDeliveries(int page, int size, String sortBy) {
        Long branchId = branchScopeService.getScopedBranchId();

        List<RiderBox> boxes = branchId == null
                ? riderBoxRepository.findByStatus(RiderBoxStatusEnum.IN_TRANSIT)
                : riderBoxRepository.findByStatusAndBranchId(RiderBoxStatusEnum.IN_TRANSIT, branchId);

        List<Map<String, Object>> deliveries = new ArrayList<>();
        Set<Long> coveredOrderIds = new HashSet<>();
        for (RiderBox box : boxes) {
            deliveries.add(mapRiderBoxToTransitDto(box));
            if (box.getOrderId() != null) {
                coveredOrderIds.add(box.getOrderId());
            }
        }

        Pageable orderPage = PageRequest.of(0, 1000, Sort.by("shippedAt").descending());
        List<DeliveryStatus> statuses = List.of(DeliveryStatus.IN_TRANSIT);
        Page<Order> transitOrders = branchId == null
                ? orderRepository.findByDeliveryStatusIn(statuses, orderPage)
                : orderRepository.findByBranchIdAndDeliveryStatusIn(branchId, statuses, orderPage);
        transitOrders.getContent().stream()
                .filter(order -> !coveredOrderIds.contains(order.getId()))
                .map(this::mapToTransitDeliveryDto)
                .forEach(deliveries::add);

        deliveries.sort(Comparator.comparing(
                (Map<String, Object> d) -> (LocalDateTime) d.get("shippedAt"),
                Comparator.nullsLast(Comparator.reverseOrder())));

        int totalElements = deliveries.size();
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        Map<String, Object> response = new HashMap<>();
        response.put("content", deliveries.subList(fromIndex, toIndex));
        response.put("totalPages", size > 0 ? (int) Math.ceil((double) totalElements / size) : 0);
        response.put("totalElements", (long) totalElements);
        response.put("currentPage", page);

        return new BaseResponse(HttpStatus.OK.value(), "Transit deliveries retrieved successfully", response);
    }

    private Map<String, Object> mapRiderBoxToTransitDto(RiderBox box) {
        PendingDeliveryDto details = detailsResolver.resolve(box);

        Map<String, Object> dto = new HashMap<>();
        dto.put("riderBoxId", box.getRiderBoxId());
        dto.put("orderId", box.getOrderId() != null ? box.getOrderId() : box.getSalesOrderId());
        dto.put("salesReference", details.getSalesReference());
        dto.put("productId", details.getProductId());
        dto.put("productName", details.getProductName());
        dto.put("productDescription", describeItems(details.getItems()));
        dto.put("customerName", details.getCustomerName());
        dto.put("customerPhone", details.getCustomerPhone());
        dto.put("deliveryAddress", details.getDeliveryAddress());
        dto.put("deliveryStatus", DeliveryStatus.IN_TRANSIT.name());
        dto.put("riderId", box.getRiderId());
        dto.put("riderName", details.getRiderName());
        dto.put("riderPhone", box.getRider() != null ? box.getRider().getPhoneNumber() : null);
        dto.put("riderImage", box.getRider() != null ? box.getRider().getPassport() : null);
        dto.put("productImage", details.getProductImage());

        LocalDateTime startedAt = box.getUpdatedAt();
        if (box.getOrderId() != null) {
            Order order = orderRepository.findById(box.getOrderId()).orElse(null);
            if (order != null) {
                dto.put("orderNumber", order.getOrderNumber());
                dto.put("totalAmount", order.getGrandTotal());
                if (order.getShippedAt() != null) {
                    startedAt = order.getShippedAt();
                }
            }
        }
        dto.put("shippedAt", startedAt);
        return dto;
    }

    // "Samsung A15 x1, Charger x2"
    private static String describeItems(List<PendingDeliveryItemDto> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        return items.stream()
                .map(i -> i.getProductName() + (i.getQuantity() != null ? " x" + i.getQuantity() : ""))
                .collect(Collectors.joining(", "));
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

        // Close out the rider's trip too, or it would stay in their app as still in transit.
        riderBoxRepository.findByOrderId(order.getId())
                .filter(box -> box.getStatus() != RiderBoxStatusEnum.DELIVERED
                        && box.getStatus() != RiderBoxStatusEnum.REJECTED)
                .ifPresent(box -> {
                    box.setStatus(RiderBoxStatusEnum.DELIVERED);
                    riderBoxRepository.save(box);
                });

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

        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            List<PendingDeliveryItemDto> items = order.getOrderItems().stream()
                    .map(RiderBoxDetailsResolver::toItemDto)
                    .collect(Collectors.toList());
            dto.put("productId", items.get(0).getProductId());
            dto.put("productName", items.get(0).getProductName());
            dto.put("productDescription", describeItems(items));
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

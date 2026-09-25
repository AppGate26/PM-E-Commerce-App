package com.appGate.delivery.service;

import com.appGate.delivery.dto.PendingDeliveryDto;
import com.appGate.delivery.dto.PendingDeliveryItemDto;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.rbac.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Looks up what a rider box is actually delivering - customer, address, products - from
 * the mobile Order and/or its SalesOrder. Shared by the rider app endpoints
 * (DeliveryOperationsService), the web transit list (TransitDeliveryService), rider
 * notifications and the feedback listing, so they all describe a delivery the same way.
 *
 * <p>A walk-in sale has no mobile Order (RiderBox.orderId is null, salesOrderId is set -
 * see RiderBoxService.assignProduct), so everything falls back to the SalesOrder. Before
 * this existed, walk-in deliveries reached the rider with no address, customer or product.
 */
@Component
public class RiderBoxDetailsResolver {

    private final OrderRepository orderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final UserRepository userRepository;

    public RiderBoxDetailsResolver(OrderRepository orderRepository,
                                   SalesOrderRepository salesOrderRepository,
                                   UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.userRepository = userRepository;
    }

    public PendingDeliveryDto resolve(RiderBox riderBox) {
        PendingDeliveryDto dto = new PendingDeliveryDto();
        dto.setRiderBoxId(riderBox.getRiderBoxId());
        dto.setOrderId(riderBox.getOrderId());
        dto.setSaleRef(riderBox.getSaleRef());
        dto.setStatus(riderBox.getStatus().name());
        dto.setRiderName(riderName(riderBox.getRider()));

        if (riderBox.getOrderId() != null) {
            orderRepository.findById(riderBox.getOrderId()).ifPresent(order -> applyOrder(dto, order));
        }

        SalesOrder salesOrder = findSalesOrder(riderBox);
        if (salesOrder != null) {
            applySalesOrder(dto, salesOrder);
        }

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            PendingDeliveryItemDto firstItem = dto.getItems().get(0);
            dto.setProductId(firstItem.getProductId());
            if (dto.getProductName() == null) dto.setProductName(firstItem.getProductName());
            if (dto.getProductImage() == null) dto.setProductImage(firstItem.getProductImage());
        }

        return dto;
    }

    public SalesOrder findSalesOrder(RiderBox riderBox) {
        if (riderBox.getOrderId() != null) {
            return salesOrderRepository.findByMobileOrderId(riderBox.getOrderId()).orElse(null);
        }
        if (riderBox.getSalesOrderId() != null) {
            return salesOrderRepository.findById(riderBox.getSalesOrderId()).orElse(null);
        }
        return null;
    }

    public static String riderName(Rider rider) {
        if (rider == null) {
            return null;
        }
        String name = ((rider.getSurName() == null ? "" : rider.getSurName()) + " "
                + (rider.getOtherName() == null ? "" : rider.getOtherName())).trim();
        return name.isEmpty() ? null : name;
    }

    private void applyOrder(PendingDeliveryDto dto, Order order) {
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setCustomerPhone(order.getDeliveryPhone());

        if (order.getUserId() != null) {
            userRepository.findById(order.getUserId())
                    .ifPresent(user -> dto.setCustomerName(user.getFirstName() + " " + user.getLastName()));
        }

        // An order can hold several products, so surface all of them via `items` -
        // productName/productImage only mirror the first one (see PendingDeliveryDto).
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            List<PendingDeliveryItemDto> items = order.getOrderItems().stream()
                    .map(RiderBoxDetailsResolver::toItemDto)
                    .collect(Collectors.toList());
            dto.setItems(items);
        }
    }

    // Only fills gaps - for a mobile order the Order itself is the source of truth.
    private void applySalesOrder(PendingDeliveryDto dto, SalesOrder salesOrder) {
        dto.setSalesReference(salesOrder.getReferenceNo());
        dto.setProductCategory(salesOrder.getCategory());
        if (dto.getDeliveryAddress() == null) dto.setDeliveryAddress(salesOrder.getAddress());
        if (dto.getCustomerPhone() == null) dto.setCustomerPhone(salesOrder.getPhoneNumber());
        if (dto.getCustomerName() == null) dto.setCustomerName(salesOrder.getCustomerName());

        if ((dto.getItems() == null || dto.getItems().isEmpty()) && salesOrder.getProductName() != null) {
            PendingDeliveryItemDto item = new PendingDeliveryItemDto();
            item.setProductId(salesOrder.getProductId());
            item.setProductName(salesOrder.getProductName());
            item.setQuantity(salesOrder.getQuantity());
            item.setUnitPrice(salesOrder.getUnitPrice() != null ? salesOrder.getUnitPrice().doubleValue() : null);
            item.setSubtotal(salesOrder.getTotalAmount() != null ? salesOrder.getTotalAmount().doubleValue() : null);
            dto.setItems(List.of(item));
        }
    }

    public static PendingDeliveryItemDto toItemDto(OrderItem orderItem) {
        PendingDeliveryItemDto itemDto = new PendingDeliveryItemDto();
        itemDto.setProductId(orderItem.getProductId());
        itemDto.setProductName(orderItem.getProductName());
        itemDto.setProductImage(orderItem.getProductImage());
        itemDto.setQuantity(orderItem.getQuantity());
        itemDto.setUnitPrice(orderItem.getUnitPrice());
        itemDto.setSubtotal(orderItem.getSubtotal());
        return itemDto;
    }
}

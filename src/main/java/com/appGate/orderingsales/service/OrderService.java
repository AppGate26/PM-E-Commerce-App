package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.CheckoutDto;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.PaymentType;
import com.appGate.orderingsales.models.Cart;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.CartRepository;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.server.ResponseStatusException;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;

    @Transactional
    public BaseResponse checkout(CheckoutDto checkoutDto) {
        try {
            // Get user's cart items
            List<Cart> cartItems = cartRepository.findByUserIdAndStatus(checkoutDto.getUserId(), true);

            if (cartItems.isEmpty()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Cart is empty", null);
            }

            // Create order
            Order order = new Order();
            order.setOrderNumber(generateOrderNumber());
            order.setUserId(checkoutDto.getUserId());
            order.setPaymentType(checkoutDto.getPaymentType());
            order.setOrderStatus(OrderStatus.PENDING);
            order.setDeliveryStatus(DeliveryStatus.NOT_SHIPPED);

            // Set delivery information
            order.setDeliveryAddress(checkoutDto.getDeliveryAddress());

            // Set delivery location using IDs
            if (checkoutDto.getDeliveryStateId() != null) {
                State state = stateRepository.findById(checkoutDto.getDeliveryStateId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery State not found"));
                order.setDeliveryState(state);
            }

            if (checkoutDto.getDeliveryLgaId() != null) {
                LGA lga = lgaRepository.findById(checkoutDto.getDeliveryLgaId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery LGA not found"));
                order.setDeliveryLga(lga);
            }

            if (checkoutDto.getDeliveryWardId() != null) {
                Ward ward = wardRepository.findById(checkoutDto.getDeliveryWardId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery Ward not found"));
                order.setDeliveryWard(ward);
            }

            order.setDeliveryCountry(checkoutDto.getDeliveryCountry());
            order.setDeliveryPostalCode(checkoutDto.getDeliveryPostalCode());
            order.setDeliveryPhone(checkoutDto.getDeliveryPhone());
            order.setDeliveryNotes(checkoutDto.getDeliveryNotes());
            order.setNotes(checkoutDto.getNotes());

            // Set installment plan if payment type is installment
            if (checkoutDto.getPaymentType() == PaymentType.INSTALLMENT) {
                order.setInstallmentPlanId(checkoutDto.getInstallmentPlanId());
            }

            // Calculate totals
            double totalAmount = 0.0;
            for (Cart cartItem : cartItems) {
                // Note: Product prices would need to be fetched from inventory-service
                // For now, assuming cart items have price information
                // This would typically involve a REST call to inventory-service
                totalAmount += 0.0; // Placeholder - would fetch actual price
            }

            // For demonstration, using a placeholder calculation
            // In production, you would fetch product details from inventory-service
            totalAmount = cartItems.stream()
                    .mapToDouble(cart -> 10000.0 * cart.getQuantity()) // Placeholder price
                    .sum();

            order.setTotalAmount(totalAmount);
            order.setDiscountAmount(0.0);
            order.setDeliveryFee(2000.0); // Flat rate for now
            order.setGrandTotal(totalAmount + 2000.0);

            // Save order
            Order savedOrder = orderRepository.save(order);

            // Create order items from cart
            for (Cart cartItem : cartItems) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setProductId(cartItem.getProductId());
                // Note: Would fetch product details from inventory-service
                orderItem.setProductName("Product " + cartItem.getProductId()); // Placeholder
                orderItem.setProductImage(null);
                orderItem.setUnitPrice(10000.0); // Placeholder
                orderItem.setQuantity(cartItem.getQuantity());
                orderItem.setSubtotal(10000.0 * cartItem.getQuantity());
                orderItem.setDiscount(0.0);
                orderItem.setTotal(10000.0 * cartItem.getQuantity());

                orderItemRepository.save(orderItem);
            }

            // Clear cart after checkout
            cartItems.forEach(item -> item.setStatus(false));
            cartRepository.saveAll(cartItems);

            // Prepare response with order details and payment info
            Map<String, Object> response = new HashMap<>();
            response.put("order", savedOrder);
            response.put("orderNumber", savedOrder.getOrderNumber());
            response.put("grandTotal", savedOrder.getGrandTotal());
            response.put("message", "Order created successfully. Proceed to payment.");

            // Note: Here you would typically call payment gateway to initialize payment
            // based on the payment type (FULL_PAYMENT, INSTALLMENT, WALLET)

            return new BaseResponse(HttpStatus.CREATED.value(), "Checkout successful", response);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Checkout failed: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderByOrderNumber(String orderNumber) {
        try {
            Order order = orderRepository.findByOrderNumber(orderNumber)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("order", order);
            response.put("orderItems", orderItems);

            return new BaseResponse(HttpStatus.OK.value(), "Order retrieved successfully", response);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserOrders(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orders = orderRepository.findByUserId(userId, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Orders retrieved successfully", orders);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve orders: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserOrdersByStatus(Long userId, OrderStatus status, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orders = orderRepository.findByUserIdAndOrderStatus(userId, status, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Orders retrieved successfully", orders);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve orders: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderDetails(Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);

            Map<String, Object> response = new HashMap<>();
            response.put("order", order);
            response.put("orderItems", orderItems);

            return new BaseResponse(HttpStatus.OK.value(), "Order details retrieved successfully", response);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order details: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            order.setOrderStatus(newStatus);

            // Update timestamps based on status
            if (newStatus == OrderStatus.SHIPPED) {
                order.setShippedAt(LocalDateTime.now());
                order.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);
            } else if (newStatus == OrderStatus.DELIVERED) {
                order.setDeliveredAt(LocalDateTime.now());
                order.setDeliveryStatus(DeliveryStatus.DELIVERED);
            } else if (newStatus == OrderStatus.CANCELLED) {
                order.setCancelledAt(LocalDateTime.now());
            }

            Order updatedOrder = orderRepository.save(order);

            return new BaseResponse(HttpStatus.OK.value(), "Order status updated successfully", updatedOrder);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to update order status: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse cancelOrder(Long orderId, String reason) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Only allow cancellation for pending or processing orders
            if (order.getOrderStatus() == OrderStatus.SHIPPED ||
                    order.getOrderStatus() == OrderStatus.DELIVERED) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot cancel order that has been shipped or delivered", null);
            }

            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setCancelledAt(LocalDateTime.now());
            order.setCancellationReason(reason);

            Order updatedOrder = orderRepository.save(order);

            return new BaseResponse(HttpStatus.OK.value(), "Order cancelled successfully", updatedOrder);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to cancel order: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updatePaymentStatus(Long orderId, String paymentReference, boolean isPaid) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            order.setPaymentReference(paymentReference);
            order.setIsPaid(isPaid);

            if (isPaid) {
                order.setPaidAt(LocalDateTime.now());
                order.setOrderStatus(OrderStatus.PAYMENT_CONFIRMED);
            }

            Order updatedOrder = orderRepository.save(order);

            return new BaseResponse(HttpStatus.OK.value(), "Payment status updated successfully", updatedOrder);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to update payment status: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOrderStatistics(Long userId) {
        try {
            Long totalOrders = orderRepository.countByUserId(userId);
            Long pendingOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.PENDING);
            Long completedOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.DELIVERED);
            Long cancelledOrders = orderRepository.countByUserIdAndOrderStatus(userId, OrderStatus.CANCELLED);

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalOrders", totalOrders);
            statistics.put("pendingOrders", pendingOrders);
            statistics.put("completedOrders", completedOrders);
            statistics.put("cancelledOrders", cancelledOrders);

            return new BaseResponse(HttpStatus.OK.value(), "Order statistics retrieved successfully", statistics);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve order statistics: " + e.getMessage(), null);
        }
    }

    // Rider endpoints
    public BaseResponse getRiderOrders(Long riderId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orders = orderRepository.findByRiderIdAndOrderStatus(riderId, OrderStatus.SHIPPED, pageable);

            return new BaseResponse(HttpStatus.OK.value(), "Rider orders retrieved successfully", orders);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve rider orders: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse assignRider(Long orderId, Long riderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            order.setRiderId(riderId);
            order.setDeliveryStatus(DeliveryStatus.AWAITING_PICKUP);

            Order updatedOrder = orderRepository.save(order);

            return new BaseResponse(HttpStatus.OK.value(), "Rider assigned successfully", updatedOrder);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to assign rider: " + e.getMessage(), null);
        }
    }

    private String generateOrderNumber() {
        return "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

package com.appGate.orderingsales.dto;

import com.appGate.account.dto.InstallmentResponseDto;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.FulfillmentType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.PaymentType;
import com.appGate.orderingsales.models.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Wire-identical mirror of {@link Order} as it's serialized today (same field set as
 * {@code Order}'s own {@code @JsonIgnoreProperties}: excludes
 * {@code hibernateLazyInitializer}/{@code handler}/{@code deliveryState}/
 * {@code deliveryLga}/{@code deliveryWard}).
 *
 * <p>Introduced as a fixed contract in front of every mobile-facing endpoint that used
 * to return the {@link Order} entity directly, so the entity/schema underneath can
 * evolve (Stage 3 onward of the order/SalesOrder unification) without changing what the
 * mobile app receives. Every field here must keep matching {@code Order}'s current JSON
 * shape - do not rename/add/remove a field here without also confirming the mobile
 * client doesn't depend on the old shape.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    private Long id;
    private String orderNumber;
    private Long userId;
    private Double totalAmount;
    private Double discountAmount;
    private Double deliveryFee;
    private Double grandTotal;
    private PaymentType paymentType;
    private OrderStatus orderStatus;
    private DeliveryStatus deliveryStatus;
    private FulfillmentType fulfillmentType;
    private String paymentReference;
    private Long installmentPlanId;
    private Boolean isPaid;
    private LocalDateTime paidAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private String deliveryAddress;
    private String deliveryCountry;
    private String deliveryPostalCode;
    private String deliveryPhone;
    private String deliveryNotes;
    private Long riderId;
    private String trackingNumber;
    private List<OrderItemDto> orderItems;
    private String notes;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private Long branchId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Added on top of the wire-identical mirror above: not a column on Order itself,
    // computed at read time so the client doesn't need a second call to the
    // installment-plan endpoints just to show payment progress on an order.
    // For a non-INSTALLMENT order these fall back to isPaid vs. grandTotal.
    // For an INSTALLMENT order, OrderService.toOrderDto overwrites these with figures
    // derived from the linked InstallmentPlan/Installment rows (summing each paid
    // installment, down payment included as installment #1), which is the accurate
    // source - see the javadoc there for why InstallmentPlan.remainingBalance alone
    // isn't good enough.
    private Double totalAmountPaid;
    private Double totalAmountRemaining;

    // Per-installment breakdown (paid vs. still due) for an INSTALLMENT order - null
    // for any other payment type. Includes the plan's down payment as installment #1
    // (see InstallmentService.buildPlan) - InstallmentPlan.downPayment/downPaymentPaid
    // just mirror that same row's amount/status for callers that don't want to walk
    // the list.
    private List<InstallmentResponseDto> installments;

    public static OrderDto from(Order order) {
        if (order == null) {
            return null;
        }
        List<OrderItemDto> items = order.getOrderItems() == null
                ? null
                : order.getOrderItems().stream().map(OrderItemDto::from).collect(Collectors.toList());
        boolean paid = Boolean.TRUE.equals(order.getIsPaid());
        double grandTotal = order.getGrandTotal() != null ? order.getGrandTotal() : 0.0;
        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .deliveryFee(order.getDeliveryFee())
                .grandTotal(order.getGrandTotal())
                .paymentType(order.getPaymentType())
                .orderStatus(order.getOrderStatus())
                .deliveryStatus(order.getDeliveryStatus())
                .fulfillmentType(order.getFulfillmentType())
                .paymentReference(order.getPaymentReference())
                .installmentPlanId(order.getInstallmentPlanId())
                .isPaid(order.getIsPaid())
                .paidAt(order.getPaidAt())
                .shippedAt(order.getShippedAt())
                .deliveredAt(order.getDeliveredAt())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryCountry(order.getDeliveryCountry())
                .deliveryPostalCode(order.getDeliveryPostalCode())
                .deliveryPhone(order.getDeliveryPhone())
                .deliveryNotes(order.getDeliveryNotes())
                .riderId(order.getRiderId())
                .trackingNumber(order.getTrackingNumber())
                .orderItems(items)
                .notes(order.getNotes())
                .cancelledAt(order.getCancelledAt())
                .cancellationReason(order.getCancellationReason())
                .branchId(order.getBranchId())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .totalAmountPaid(paid ? grandTotal : 0.0)
                .totalAmountRemaining(paid ? 0.0 : grandTotal)
                .build();
    }
}

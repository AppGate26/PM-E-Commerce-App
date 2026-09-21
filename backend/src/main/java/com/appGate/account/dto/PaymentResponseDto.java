package com.appGate.account.dto;

import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.models.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Wire-identical mirror of {@link Payment} as it's serialized today. Introduced as a
 * fixed contract in front of {@code GET /api/payments/verify/{reference}} (the one
 * mobile-facing endpoint returning this entity directly) so the schema underneath can
 * evolve without changing what the mobile app receives.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponseDto {
    private Long id;
    private Long branchId;
    private Long orderId;
    private Long salesOrderId;
    private Long userId;
    private Double amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String paymentReference;
    private String gatewayReference;
    private String gatewayResponse;
    private LocalDateTime paidAt;
    private String failureReason;
    private Long installmentId;
    private Boolean isInstallmentPayment;
    private Long installmentPlanId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    public static PaymentResponseDto from(Payment payment) {
        if (payment == null) {
            return null;
        }
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .branchId(payment.getBranchId())
                .orderId(payment.getOrderId())
                .salesOrderId(payment.getSalesOrderId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .paymentReference(payment.getPaymentReference())
                .gatewayReference(payment.getGatewayReference())
                .gatewayResponse(payment.getGatewayResponse())
                .paidAt(payment.getPaidAt())
                .failureReason(payment.getFailureReason())
                .installmentId(payment.getInstallmentId())
                .isInstallmentPayment(payment.getIsInstallmentPayment())
                .installmentPlanId(payment.getInstallmentPlanId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .createdBy(payment.getCreatedBy())
                .updatedBy(payment.getUpdatedBy())
                .build();
    }
}

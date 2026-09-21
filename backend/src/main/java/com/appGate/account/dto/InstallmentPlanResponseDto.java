package com.appGate.account.dto;

import com.appGate.account.enums.InstallmentFrequency;
import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.InstallmentPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Wire-identical mirror of {@link InstallmentPlan} as it's serialized today. Introduced
 * as a fixed contract in front of every mobile-facing endpoint that used to return the
 * entity directly, so the schema underneath can evolve (Stage 3 onward of the order/
 * SalesOrder unification) without changing what the mobile app receives. Keep this in
 * lockstep with {@code InstallmentPlan}'s current JSON shape.
 *
 * <p><b>How to render the amounts.</b> {@code grandTotal} and {@code installmentAmount}
 * describe the FINANCED amount only (product subtotal + insurance): delivery is never
 * financed, so it is never part of a period's payment. The delivery fee rides entirely on
 * the first payment, which is why three derived fields are served alongside them:
 *
 * <ul>
 *   <li>{@code deliveryFee} - the fee quoted for this plan's cart/destination, charged
 *       once, in full, with the down payment.</li>
 *   <li>{@code firstPaymentAmount} = {@code downPayment} + {@code deliveryFee} - what the
 *       customer actually pays up front.</li>
 *   <li>{@code totalPayable} = {@code grandTotal} + {@code deliveryFee} - everything the
 *       plan will collect across its lifetime.</li>
 * </ul>
 *
 * Display {@code firstPaymentAmount} for period #1 and {@code installmentAmount} for the
 * rest. Do NOT divide {@code totalPayable} by {@code numberOfInstallments} - that spreads
 * the delivery fee across the months, which is exactly what this breakdown exists to
 * prevent.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallmentPlanResponseDto {
    private Long id;
    private Long orderId;
    private Long userId;
    private Long productId;
    private Double totalAmount;
    private Double insuranceAmount;
    private Double grandTotal;
    private Double downPayment;
    private Double remainingBalance;
    private Double installmentAmount;
    // Delivery, charged once with the first payment and never financed - see the class
    // javadoc. deliveryFee mirrors the plan column; the other two are derived, served so
    // no client has to (mis)compute them.
    private Double deliveryFee;
    private Double firstPaymentAmount;
    private Double totalPayable;
    private InstallmentFrequency frequency;
    private Integer numberOfInstallments;
    private Integer completedInstallments;
    private InstallmentStatus status;
    private LocalDate startDate;
    private LocalDate nextPaymentDate;
    private LocalDate completionDate;
    private Boolean earlyShipmentEligible;
    private Boolean downPaymentPaid;
    private LocalDateTime downPaymentPaidAt;
    private String downPaymentReference;
    private List<InstallmentResponseDto> installments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    public static InstallmentPlanResponseDto from(InstallmentPlan plan) {
        if (plan == null) {
            return null;
        }
        List<InstallmentResponseDto> installments = plan.getInstallments() == null
                ? null
                : plan.getInstallments().stream().map(InstallmentResponseDto::from).collect(Collectors.toList());
        // Null-safe: plans created before the delivery fee was quoted onto the plan
        // (pre-V1000.9 rows) carry no fee, and a walk-in credit sale's shadow plan
        // (SalesService.createInstallmentPlanShadow) has no down payment of its own.
        double deliveryFee = plan.getDeliveryFee() != null ? plan.getDeliveryFee() : 0.0;
        double downPayment = plan.getDownPayment() != null ? plan.getDownPayment() : 0.0;
        double grandTotal = plan.getGrandTotal() != null ? plan.getGrandTotal() : 0.0;
        return InstallmentPlanResponseDto.builder()
                .id(plan.getId())
                .orderId(plan.getOrderId())
                .userId(plan.getUserId())
                .productId(plan.getProductId())
                .totalAmount(plan.getTotalAmount())
                .insuranceAmount(plan.getInsuranceAmount())
                .grandTotal(plan.getGrandTotal())
                .downPayment(plan.getDownPayment())
                .remainingBalance(plan.getRemainingBalance())
                .installmentAmount(plan.getInstallmentAmount())
                .deliveryFee(deliveryFee)
                .firstPaymentAmount(downPayment + deliveryFee)
                .totalPayable(grandTotal + deliveryFee)
                .frequency(plan.getFrequency())
                .numberOfInstallments(plan.getNumberOfInstallments())
                .completedInstallments(plan.getCompletedInstallments())
                .status(plan.getStatus())
                .startDate(plan.getStartDate())
                .nextPaymentDate(plan.getNextPaymentDate())
                .completionDate(plan.getCompletionDate())
                .earlyShipmentEligible(plan.getEarlyShipmentEligible())
                .downPaymentPaid(plan.getDownPaymentPaid())
                .downPaymentPaidAt(plan.getDownPaymentPaidAt())
                .downPaymentReference(plan.getDownPaymentReference())
                .installments(installments)
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .createdBy(plan.getCreatedBy())
                .updatedBy(plan.getUpdatedBy())
                .build();
    }
}

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
 * describe the FINANCED amount only (product subtotal + insurance). The delivery fee is
 * spread evenly across the installments that make up the first 50% of the plan (see
 * InstallmentDeliveryFeeSpread): each of those rows' {@code amountDue} includes its
 * {@code deliveryFeePortion}, and the rest stay {@code installmentAmount}. Derived fields:
 *
 * <ul>
 *   <li>{@code deliveryFee} - the total fee quoted for this plan's cart/destination.</li>
 *   <li>{@code firstPaymentAmount} - installment #1's amountDue (downPayment + its
 *       delivery share): what the customer actually pays up front.</li>
 *   <li>{@code totalPayable} = {@code grandTotal} + {@code deliveryFee} - everything the
 *       plan will collect across its lifetime.</li>
 * </ul>
 *
 * Display each row's {@code amountDue} from {@code installments}. Do NOT divide
 * {@code totalPayable} by {@code numberOfInstallments} - delivery is only spread across
 * the first half of the plan, not all of it.
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
    // Delivery, spread over the first half of the installments - see the class javadoc. deliveryFee mirrors the plan column; the other two are derived, served so
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
        // Row #1 already carries its delivery share. A legacy plan whose rows were never
        // spread (null share) collected the whole fee with the down payment instead.
        double firstPaymentAmount = plan.getInstallments() == null ? downPayment + deliveryFee
                : plan.getInstallments().stream()
                        .filter(row -> Integer.valueOf(1).equals(row.getInstallmentNumber())
                                && row.getDeliveryFeePortion() != null)
                        .mapToDouble(row -> row.getAmountDue() != null ? row.getAmountDue() : 0.0)
                        .findFirst()
                        .orElse(downPayment + deliveryFee);
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
                .firstPaymentAmount(firstPaymentAmount)
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

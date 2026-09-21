package com.appGate.account.dto;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Wire-identical mirror of {@link Installment} as it's serialized today (the entity
 * excludes its {@code installmentPlan} back-reference via {@code @JsonBackReference},
 * which this simply omits). See {@link InstallmentPlanResponseDto} for why this exists.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstallmentResponseDto {
    private Long id;
    private Integer installmentNumber;
    private Double amountDue;
    private Double amountPaid;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private InstallmentStatus status;
    private Long paymentId;
    private Integer daysOverdue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;

    public static InstallmentResponseDto from(Installment installment) {
        if (installment == null) {
            return null;
        }
        return InstallmentResponseDto.builder()
                .id(installment.getId())
                .installmentNumber(installment.getInstallmentNumber())
                .amountDue(installment.getAmountDue())
                .amountPaid(installment.getAmountPaid())
                .dueDate(installment.getDueDate())
                .paidDate(installment.getPaidDate())
                .status(installment.getStatus())
                .paymentId(installment.getPaymentId())
                .daysOverdue(installment.getDaysOverdue())
                .createdAt(installment.getCreatedAt())
                .updatedAt(installment.getUpdatedAt())
                .createdBy(installment.getCreatedBy())
                .updatedBy(installment.getUpdatedBy())
                .build();
    }
}

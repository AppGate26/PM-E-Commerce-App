package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateLoanNotificationDto {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Customer name is required")
    private String customerName;

    @NotNull(message = "Customer email is required")
    private String customerEmail;

    @NotNull(message = "Customer phone is required")
    private String customerPhone;

    @NotNull(message = "Notification type is required")
    private String notificationType; // PAYMENT_DUE, PAYMENT_OVERDUE, FINAL_WARNING, DEFAULT

    @NotNull(message = "Loan amount is required")
    private BigDecimal loanAmount;

    @NotNull(message = "Amount due is required")
    private BigDecimal amountDue;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String message;
}

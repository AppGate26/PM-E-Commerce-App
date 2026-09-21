package com.appGate.orderingsales.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepaymentEntryDetailDto {
    private Integer entryNumber;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;

    // The "Payment History" table (OrderTab > Mark as Paid) reads these exact field
    // names (date/amount/method/reference) - it predates entryNumber/amountDue/etc
    // above and was never updated to match, so every row showed "Invalid Date"/N/A
    // once real (non-zero) payment progress started flowing through this DTO.
    // date/amount mirror whichever of paidDate/dueDate and amountPaid/amountDue is
    // relevant for that row's status; method/reference come from the linked Payment
    // row where one exists (see SalesService.attachPaymentMethodAndReference).
    private LocalDate date;
    private BigDecimal amount;
    private String method;
    private String reference;
}

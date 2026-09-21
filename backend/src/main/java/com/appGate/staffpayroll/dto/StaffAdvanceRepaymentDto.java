package com.appGate.staffpayroll.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StaffAdvanceRepaymentDto {
    private Long advanceId;
    private LocalDate repaymentDate;
    private BigDecimal amount;
    private String month;
    private String status;
    private String remarks;
}

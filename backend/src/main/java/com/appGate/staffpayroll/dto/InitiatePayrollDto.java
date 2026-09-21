package com.appGate.staffpayroll.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class InitiatePayrollDto {
    private String period;
    private LocalDate paymentDate;
    private Long initiatedBy;
}

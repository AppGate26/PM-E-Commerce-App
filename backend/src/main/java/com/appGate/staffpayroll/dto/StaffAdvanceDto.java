package com.appGate.staffpayroll.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StaffAdvanceDto {
    private Long staffId;
    private LocalDate requestDate;
    private BigDecimal amount;
    private Integer tenure;
    private BigDecimal interestRate;
    private String receiverAccountName;
    private String receiverAccountNumber;
    private String receiverBankName;
    private String reason;
}

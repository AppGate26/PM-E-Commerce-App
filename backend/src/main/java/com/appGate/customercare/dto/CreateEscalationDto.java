package com.appGate.customercare.dto;

import com.appGate.customercare.enums.EscalationTarget;
import lombok.Data;

@Data
public class CreateEscalationDto {
    private EscalationTarget target;
    private String department;
    private String email;
    private String priority;
    private String subject;
    private String details;
    private String raisedBy;
}

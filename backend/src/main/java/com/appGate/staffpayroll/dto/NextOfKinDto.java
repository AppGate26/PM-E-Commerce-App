package com.appGate.staffpayroll.dto;

import com.appGate.staffpayroll.enums.RelationshipEnum;
import lombok.Data;

@Data
public class NextOfKinDto {
    private Long staffId;
    private String fullName;
    private String phoneNumber;
    private RelationshipEnum relationship;
}

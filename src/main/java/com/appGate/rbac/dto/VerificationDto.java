package com.appGate.rbac.dto;

import com.appGate.rbac.enums.GenderEnum;
import com.appGate.rbac.enums.MaritalStatusEnum;
// import com.appGate.rbac.models.EmploymentInformation;


import lombok.Data;

@Data
public class VerificationDto {
    private String homeAddress;
    private String city;
    private String stateOfOrigin;
    private GenderEnum gender;
    private String dateOfBirth;
    // private EmploymentInformation employmentInformation;
    private MaritalStatusEnum maritalStatus;
    private UtilityBillDto utitlityBill; 
}

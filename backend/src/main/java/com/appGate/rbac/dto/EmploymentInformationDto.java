package com.appGate.rbac.dto;

import com.appGate.rbac.enums.EmploymentTypeEnum;
import com.appGate.rbac.enums.JobRoleEnum;
import com.appGate.rbac.enums.PaymentIntentionEnum;
import com.appGate.rbac.enums.ReasonForUnemploymentEnum;

import lombok.Data;

@Data
public class EmploymentInformationDto {

    private Long userId;
    private EmploymentTypeEnum employmentType;
    private String nameOfCompany;
    private String sector;
    private JobRoleEnum jobRole;
    private String employerName;
    private String employerEmail;
    private String employerPhoneNumber;
    private Integer yearsOfEmployment;
    private String salaryRange;
    private Boolean anyEmploymentHistory;
    private ReasonForUnemploymentEnum reasonForUnemployment;
    private PaymentIntentionEnum intentionForPayment;
    private String savingsRange;
    private String cacRegistrationNumber;
    private String descriptionOfServiceProduct;
    private Boolean employerOfLabour;
    private Integer workForce;
    private String profitRange; 
    
}

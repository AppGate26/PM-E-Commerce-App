package com.appGate.rbac.models;

import com.appGate.rbac.enums.JobRoleEnum;
import com.appGate.rbac.enums.PaymentIntentionEnum;
import com.appGate.rbac.enums.ReasonForUnemploymentEnum;
import com.appGate.rbac.enums.EmploymentTypeEnum;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "employment_information")
public class EmploymentInformation  extends BaseEntity{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "employmentType", columnDefinition = "VARCHAR(255)")
    @Enumerated(EnumType.STRING)
    private EmploymentTypeEnum employmentType;

    @Column(name = "nameOfCompany")
    private String nameOfCompany;
    
    @Column(name = "cacRegistrationNumber")
    private String cacRegistrationNumber;
    
    @Column(name = "descriptionOfServiceProduct")
    private String descriptionOfServiceProduct;
    
    @Column(name = "employerOfLabour")
    private Boolean employerOfLabour;
    
    @Column(name = "workForce")
    private Integer workForce;
    
    @Column(name = "profitRange")
    private String profitRange;
    
    @Column(name = "sector")
    private String sector; 
    
    @Column(name = "jobRole", columnDefinition = "VARCHAR(255)")
    @Enumerated(EnumType.STRING)
    private JobRoleEnum jobRole; 
    
    @Column(name = "employerName")
    private String employerName; 
    
    @Column(name = "employerEmail")
    private String employerEmail; 

    @Column(name = "employerPhoneNumber")
    private String employerPhoneNumber;

    @Column(name = "yearsOfEmployment")
    private Integer yearsOfEmployment;

    @Column(name = "salaryRange")
    private String salaryRange;

    @Column(name = "anyEmploymentHistory")
    private Boolean anyEmploymentHistory;

    @Column(name = "reasonForUnemployment", columnDefinition = "VARCHAR(255)")
    @Enumerated(EnumType.STRING)
    private ReasonForUnemploymentEnum reasonForUnemployment;

    @Column(name = "intentionForPayment", columnDefinition = "VARCHAR(255)")
    @Enumerated(EnumType.STRING)
    private PaymentIntentionEnum intentionForPayment;

    @Column(name = "savingsRange")
    private String savingsRange;
    
}

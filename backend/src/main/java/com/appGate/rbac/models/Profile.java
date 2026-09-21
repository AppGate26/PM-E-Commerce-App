package com.appGate.rbac.models;

import com.appGate.rbac.enums.GenderEnum;
import com.appGate.rbac.enums.MaritalStatusEnum;
import com.appGate.rbac.enums.EmploymentTypeEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "profile")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "state", "lga", "ward", "user", "utilityBill"})
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "profilePicture")
    private String profilePicture;

    @Column(name = "email")
    private String email;
    
    @Column(name = "firstName")
    private String firstName;
    
    @Column(name = "lastName")
    private String lastName;
    
    @Column(name = "phoneNumber")
    private String phoneNumber;

    // @Column(name = "bvn")
    // private String bvn;

    @Column(name = "home_address")
    private String homeAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_id", referencedColumnName = "id")
    private State state;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lga_id", referencedColumnName = "id")
    private LGA lga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", referencedColumnName = "id")
    private Ward ward;


    @Enumerated(EnumType.STRING)
    private GenderEnum gender;
    
    @Column(name = "dateOfBirth")
    private String dateOfBirth;
    
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "employment_information_id", referencedColumnName = "id")
    private EmploymentInformation employmentInformation;
    
    @Column(name = "maritalStatus")
    private MaritalStatusEnum maritalStatus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utility_bill_id", referencedColumnName = "id")
    private UtilityBill utilityBill;

    @Column(name = "verificationStatus")
    private Boolean verificationStatus;
}

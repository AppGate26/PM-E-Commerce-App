package com.appGate.delivery.models;
import com.appGate.delivery.enums.GenderEnum;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name =  "RiderDetails")
public class Rider extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  long riderId;
    @Column(name = "sur_name")
    private  String surName;
    @Column(name = "other_name")
    private  String otherName;
    @Column(name = "email", unique = true)
    private  String email;
    @Column(name = "password")
    private  String password;
    @Column(name = "phone_number", unique = true)
    private   String phoneNumber;
    @Enumerated(EnumType.STRING)
    private GenderEnum gender;
    @Column(name = "contact_address")
    private String contactAddress;
    @Column(name = "office_address")
    private  String officeAddress;
    @Column(name = "dob")
    private String dob;
    @Column(name = "nationality")
    private  String nationality;
    @Column(name = "nin")
    private String Nin;
    @Column(name = "bvn")
    private  String Bvn;
    @Column(name = "next_of_kin")
    private  String nextOfKin;
    @Column(name = "next_of_kin_address")
    private  String nextOfKinAddress;
    @Column(name = "passport_Image")
    private  String passport;
    @Column(name = "licences_Image")
    private  String licences;
    @Column(name = "signature_Image")
    private  String signature;
    @Column(name = "suspended")
    private Boolean suspended = false;
    @Column(name = "reasonForSuspension")
    private  String reasonForSuspension;
    @Column(name = "reasonForUnblocking")
    private String reasonForUnblocking;

    @Column(name = "resetOtp")
    private String resetOtp;

}

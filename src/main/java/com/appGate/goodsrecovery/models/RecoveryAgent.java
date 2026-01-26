package com.appGate.goodsrecovery.models;

import com.appGate.delivery.enums.GenderEnum;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "recovery_agents")
public class RecoveryAgent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password")
    private String password;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "suspended")
    private Boolean suspended = false;

    @Column(name = "reason_for_suspension")
    private String reasonForSuspension;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    private GenderEnum gender;
    @Column(name = "contact_address")
    private String contactAddress;
    @Column(name = "office_address")
    private String officeAddress;
    @Column(name = "dob")
    private String dob;
    @Column(name = "nationality")
    private String nationality;
    @Column(name = "nin")
    private String Nin;
    @Column(name = "bvn")
    private String Bvn;
    @Column(name = "next_of_kin")
    private String nextOfKin;
    @Column(name = "next_of_kin_address")
    private String nextOfKinAddress;
    @Column(name = "passport_Image")
    private String passport;
    @Column(name = "licences_Image")
    private String licences;
    @Column(name = "signature_Image")
    private String signature;
    @Column(name = "reasonForUnblocking")
    private String reasonForUnblocking;
}

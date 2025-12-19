package com.appGate.client.models;

import com.appGate.client.enums.CustomerTypeEnum;
import com.appGate.client.enums.GenderEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "customers")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "contactState", "contactLga", "contactWard", "officeState", "officeLga", "officeWard", "nextOfKinState", "nextOfKinLga", "nextOfKinWard" })
public class Customer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "accountNumber")
    private String accountNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "surname")
    private String surname ;

    @Column(name = "firstName")
    private String firstName;

    @Column(name = "dob")
    private String dob;

    @Column(name = "phoneNumber")
    private String phoneNumber;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "nin")
    private String nin;

    @Column(name = "bvn")
    private String bvn;

    @Column(name = "contactAddress")
    private String contactAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_state_id", referencedColumnName = "id")
    private com.appGate.rbac.models.State contactState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_lga_id", referencedColumnName = "id")
    private com.appGate.rbac.models.LGA contactLga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_ward_id", referencedColumnName = "id")
    private com.appGate.rbac.models.Ward contactWard;

    @Column(name = "officeAddress")
    private String officeAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_state_id", referencedColumnName = "id")
    private com.appGate.rbac.models.State officeState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_lga_id", referencedColumnName = "id")
    private com.appGate.rbac.models.LGA officeLga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_ward_id", referencedColumnName = "id")
    private com.appGate.rbac.models.Ward officeWard;

    @Column(name = "nextOfKin")
    private String nextOfKin;

    @Column(name = "nextOfKinAddress")
    private String nextOfKinAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_of_kin_state_id", referencedColumnName = "id")
    private com.appGate.rbac.models.State nextOfKinState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_of_kin_lga_id", referencedColumnName = "id")
    private com.appGate.rbac.models.LGA nextOfKinLga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_of_kin_ward_id", referencedColumnName = "id")
    private com.appGate.rbac.models.Ward nextOfKinWard;

    @Column(name = "passport")
    private String passport;

    @Column(name = "signature")
    private String signature;

    @Enumerated(EnumType.STRING)
    private GenderEnum gender;

    @Enumerated(EnumType.STRING)
    private CustomerTypeEnum customerType;

    @Column(name = "suspended")
    private Boolean suspended = false;

    @Column(name = "reasonForSuspension")
    private String reasonForSuspension;

    @Column(name = "reasonForUnblocking")
    private String reasonForUnblocking;
}

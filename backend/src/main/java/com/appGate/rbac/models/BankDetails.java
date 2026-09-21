package com.appGate.rbac.models;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
@Table(name = "employment_information")
public class BankDetails  extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "accountNumber")
    private String accountNumber;

    @Column(name = "accountName")
    private String accountName;

    @Column(name = "bankName")
    private String bankName;

    @Column(name = "branchCode")
    private String branchCode;

    @Column(name = "bvn")
    private String bvn;

    @Column(name = "nin")
    private String nin; 

    @Column(name = "currency")
    private String currency;
}

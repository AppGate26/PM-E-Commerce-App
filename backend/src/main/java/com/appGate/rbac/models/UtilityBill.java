package com.appGate.rbac.models;

import com.appGate.rbac.enums.UtilityBillEnum;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "utility_bills")
public class UtilityBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    private UtilityBillEnum utilityBill;

    @Column(name = "utilityBillPicture")
    private String utilityBillPicture;
}

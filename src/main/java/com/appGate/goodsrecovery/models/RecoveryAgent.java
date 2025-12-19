package com.appGate.goodsrecovery.models;

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
}

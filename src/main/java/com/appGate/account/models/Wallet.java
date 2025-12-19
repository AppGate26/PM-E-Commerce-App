package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "wallets")
@Data
@EqualsAndHashCode(callSuper = true)
public class Wallet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(nullable = false, length = 10)
    private String currency = "NGN";

    @Column(nullable = false)
    private Boolean isActive = true;

    private String accountNumber; // Virtual account number for wallet funding

    private String bankName; // Virtual bank name
}

package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "delivery_setups")
@Data
@EqualsAndHashCode(callSuper = true)
public class DeliverySetup extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "weight_kg_gram")
    private String weightKgGram; // e.g., "5 KG", "500 GRAM"

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "delivery_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal deliveryFee;

    @Column(name = "account_to_credit")
    private String accountToCredit; // GL Code of account to credit

    @Column(name = "is_active")
    private Boolean isActive = true;
}

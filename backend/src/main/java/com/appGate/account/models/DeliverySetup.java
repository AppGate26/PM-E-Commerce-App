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

    // Not marked nullable=false at the DB level (no Flyway here -- schema is
    // Hibernate ddl-auto=update, and an ALTER ADD COLUMN ... NOT NULL would fail
    // against a table that already has rows). Required-ness is enforced in
    // DeliverySetupDto instead.
    @Column(name = "category_id")
    private Long categoryId;

    // Denormalized display name, synced from Category whenever categoryId is set.
    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "weight_min_kg", precision = 10, scale = 3)
    private BigDecimal weightMinKg;

    @Column(name = "weight_max_kg", precision = 10, scale = 3)
    private BigDecimal weightMaxKg; // null = unbounded ("X kg and above")

    @Column(name = "distance_min_km", precision = 10, scale = 2)
    private BigDecimal distanceMinKm;

    @Column(name = "distance_max_km", precision = 10, scale = 2)
    private BigDecimal distanceMaxKm; // null = unbounded ("X km and above")

    // Rate per km for this weight+distance bracket, not a flat total -- the
    // final line fee is this value multiplied by the actual computed distance.
    @Column(name = "delivery_fee", precision = 15, scale = 2, nullable = false)
    private BigDecimal deliveryFee;

    @Column(name = "account_to_credit")
    private String accountToCredit; // GL Code of account to credit

    @Column(name = "is_active")
    private Boolean isActive = true;
}

package com.appGate.goodsrecovery.models;

import com.appGate.goodsrecovery.enums.GoodsRecoveryStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "recovery_items")
public class RecoveryItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goods_recovery_id", nullable = false)
    private Long goodsRecoveryId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "recovery_photo")
    private String recoveryPhoto;

    @Column(name = "time_of_recovery")
    private LocalDateTime timeOfRecovery;

    @Column(name = "number_of_items_recovered")
    private Integer numberOfItemsRecovered = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GoodsRecoveryStatus status = GoodsRecoveryStatus.NOT_YET_RECOVERED;
}

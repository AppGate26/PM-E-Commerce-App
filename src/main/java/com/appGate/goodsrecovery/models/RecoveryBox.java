package com.appGate.goodsrecovery.models;

import com.appGate.goodsrecovery.enums.RecoveryBoxStatusEnum;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "recovery_box")
@Data
public class RecoveryBox extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recoveryBoxId;

    @Column(name = "goods_recovery_id", nullable = false)
    private Long goodsRecoveryId;

    @Column(name = "recovery_agent_id")
    private Long recoveryAgentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RecoveryBoxStatusEnum status = RecoveryBoxStatusEnum.PENDING;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_address", length = 500)
    private String customerAddress;

    @Column(name = "items_to_recover")
    private Integer itemsToRecover;

    @Column(name = "items_recovered")
    private Integer itemsRecovered = 0;

    @Column(name = "notes", length = 1000)
    private String notes;

    @ManyToOne
    @JoinColumn(name = "goods_recovery_id", referencedColumnName = "id", insertable = false, updatable = false)
    private GoodsRecovery goodsRecovery;

    @ManyToOne
    @JoinColumn(name = "recovery_agent_id", referencedColumnName = "id", insertable = false, updatable = false)
    private RecoveryAgent recoveryAgent;
}

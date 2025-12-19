package com.appGate.goodsrecovery.models;

import com.appGate.goodsrecovery.enums.GoodsRecoveryStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "goods_recoveries")
public class GoodsRecovery extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "recovery_agent_id")
    private Long recoveryAgentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GoodsRecoveryStatus status = GoodsRecoveryStatus.NOT_YET_RECOVERED;

    @Column(name = "total_items")
    private Integer totalItems = 0;

    @Column(name = "recovered_items")
    private Integer recoveredItems = 0;

    @Column(name = "notes", length = 1000)
    private String notes;
}

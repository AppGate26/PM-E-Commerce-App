package com.appGate.warehouse.models;

import com.appGate.warehouse.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "warehouse_movements")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseMovement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_no", unique = true)
    private String referenceNo;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "receiver_warehouse_id")
    private Long receiverWarehouseId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false)
    private MovementType movementType;

    @Column(name = "quantity_in")
    private Integer quantityIn = 0;

    @Column(name = "quantity_out")
    private Integer quantityOut = 0;

    @Column(name = "balance_after")
    private Integer balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private SourceType sourceType;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "received_by")
    private Long receivedBy;

    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_condition")
    private ProductCondition condition;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "stock_increment")
    private Integer stockIncrement;

    @Column(name = "stock_decrease")
    private Integer stockDecrease;

    @Column(name = "account_to_debit")
    private String accountToDebit;

    @Column(name = "account_to_credit")
    private String accountToCredit;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "notes", length = 500)
    private String notes;
}

package com.appGate.warehouse.models;

import com.appGate.warehouse.enums.WarehouseStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "warehouses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Warehouse extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_name", nullable = false)
    private String warehouseName;

    @Column(name = "branch_code")
    private String branchCode;

    @Column(name = "location_address")
    private String locationAddress;

    @Column(name = "state_city")
    private String stateCity;

    @Column(name = "branch_manager_id")
    private Long branchManagerId;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private WarehouseStatus status = WarehouseStatus.ACTIVE;

    @Column(name = "storage_capacity", precision = 15, scale = 2)
    private BigDecimal storageCapacity;

    @Column(name = "branch_id")
    private Long branchId;
}

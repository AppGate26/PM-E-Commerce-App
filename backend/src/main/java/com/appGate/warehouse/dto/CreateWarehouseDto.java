package com.appGate.warehouse.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateWarehouseDto {
    private String warehouseName;
    private String branchCode;
    private String locationAddress;
    private String stateCity;
    private Long branchManagerId;
    private String phoneNumber;
    private String email;
    private BigDecimal storageCapacity;
    private Long branchId;
}

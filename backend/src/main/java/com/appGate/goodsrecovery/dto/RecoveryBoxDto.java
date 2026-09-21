package com.appGate.goodsrecovery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecoveryBoxDto {

    @NotNull(message = "Goods recovery ID is required")
    private Long goodsRecoveryId;

    private Long recoveryAgentId;

    private String customerName;

    private String customerAddress;

    private Integer itemsToRecover;

    private String notes;
}

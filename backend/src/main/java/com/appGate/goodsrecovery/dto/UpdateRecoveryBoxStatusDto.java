package com.appGate.goodsrecovery.dto;

import com.appGate.goodsrecovery.enums.RecoveryBoxStatusEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRecoveryBoxStatusDto {

    @NotNull(message = "Status is required")
    private RecoveryBoxStatusEnum status;

    private Integer itemsRecovered;

    private String notes;
}

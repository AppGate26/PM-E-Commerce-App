package com.appGate.delivery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UnblockRiderDto {

    @NotNull
    private  String reasonForUnblocking;
}

package com.appGate.delivery.dto;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class SuspendRiderDto {

    @NotNull
    private  String reasonForSuspension;
}

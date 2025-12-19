package com.appGate.client.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SuspendCustomerDto {

    @NotNull
    private String reasonForSuspension;
}

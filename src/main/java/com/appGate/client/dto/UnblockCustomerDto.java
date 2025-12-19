package com.appGate.client.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UnblockCustomerDto {

    @NotNull
    private String reasonForUnblocking;

}

package com.appGate.orderingsales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestoreReturnRequestDto {

    @NotNull(message = "Date received for restoration is required")
    private LocalDate restorationReceivedAt;

    @NotNull(message = "Date restored is required")
    private LocalDate restorationCompletedAt;

    @NotBlank(message = "Restoration description is required")
    private String restorationDescription;
}

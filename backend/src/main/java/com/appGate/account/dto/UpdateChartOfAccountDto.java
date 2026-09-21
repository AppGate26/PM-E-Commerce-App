package com.appGate.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateChartOfAccountDto {

    @NotBlank(message = "Description is required")
    private String description;
}

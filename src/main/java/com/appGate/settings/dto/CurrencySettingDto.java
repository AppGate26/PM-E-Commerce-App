package com.appGate.settings.dto;

import com.appGate.settings.enums.CurrencyEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CurrencySettingDto {
    @NotNull(message = "Currency is required")
    private CurrencyEnum currency;
}

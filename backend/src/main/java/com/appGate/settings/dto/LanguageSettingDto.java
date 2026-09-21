package com.appGate.settings.dto;

import com.appGate.settings.enums.LanguageEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LanguageSettingDto {
    @NotNull(message = "Language is required")
    private LanguageEnum language;
}

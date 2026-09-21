package com.appGate.mail.dto;

import com.appGate.mail.enums.MailTypeEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MailDisplayOptionDto {
    @NotNull(message = "Mail display option is required")
    private MailTypeEnum mailDisplayOption;
}

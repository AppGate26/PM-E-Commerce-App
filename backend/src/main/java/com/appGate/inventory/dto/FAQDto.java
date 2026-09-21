package com.appGate.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FAQDto {

    @NotBlank(message = "Question is required")
    private String question;

    @NotBlank(message = "Answer is required")
    private String answer;

    private Integer displayOrder;

    private Boolean isActive;
}

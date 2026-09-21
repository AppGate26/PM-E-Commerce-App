package com.appGate.orderingsales.dto;

import com.appGate.orderingsales.enums.ReturnStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReturnStatusDto {

    @NotNull(message = "Status is required")
    private ReturnStatus status;

    private String adminNotes;

    @NotNull(message = "Reviewer ID is required")
    private Long reviewedBy;
}

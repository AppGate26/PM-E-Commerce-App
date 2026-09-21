package com.appGate.account.dto;

import com.appGate.account.enums.DisputeCategory;
import com.appGate.account.enums.DisputeResolution;
import com.appGate.account.enums.DisputeStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DisputeFilterDto {

    private DisputeStatus status;

    private DisputeResolution resolution;

    private DisputeCategory category;

    private LocalDate startDate;

    private LocalDate endDate;
}

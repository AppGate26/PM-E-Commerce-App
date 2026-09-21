package com.appGate.staffpayroll.dto;

import com.appGate.staffpayroll.enums.EmploymentTypeEnum;
import com.appGate.staffpayroll.enums.StaffStatusEnum;
import lombok.Data;
import java.time.LocalDate;

@Data
public class EmploymentDetailsDto {
    private Long staffId;
    private String department;
    private String designation;
    private String staffGroup;
    private EmploymentTypeEnum employmentType;
    private LocalDate employmentDate;
    private String salaryLevel;
    private StaffStatusEnum staffStatus;
}

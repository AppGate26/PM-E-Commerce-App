package com.appGate.staffpayroll.models;

import com.appGate.staffpayroll.enums.EmploymentTypeEnum;
import com.appGate.staffpayroll.enums.StaffStatusEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "staff_employment_details")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EmploymentDetails extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false, unique = true)
    private Long staffId;

    @Column(name = "department")
    private String department;

    @Column(name = "designation")
    private String designation;

    @Column(name = "staff_group")
    private String staffGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type")
    private EmploymentTypeEnum employmentType;

    @Column(name = "employment_date")
    private LocalDate employmentDate;

    @Column(name = "salary_level")
    private String salaryLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "staff_status")
    private StaffStatusEnum staffStatus = StaffStatusEnum.ACTIVE;
}

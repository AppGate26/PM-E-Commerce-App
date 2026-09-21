package com.appGate.staffpayroll.models;

import com.appGate.rbac.context.BranchOwned;
import com.appGate.staffpayroll.enums.StaffStatusEnum;
import com.appGate.staffpayroll.enums.TitleEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

/**
 * A member of staff is posted to exactly one branch. Staff is the anchor for the
 * whole payroll module: a branch manager sees only the staff at their branch, and
 * therefore only those staff's salaries, advances and payroll entries.
 */
@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "staff")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Staff extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "staff_id", unique = true, nullable = false)
    private String staffId;

    @Enumerated(EnumType.STRING)
    @Column(name = "title")
    private TitleEnum title;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "gender")
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "home_address")
    private String homeAddress;

    @Column(name = "state_of_origin")
    private String stateOfOrigin;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StaffStatusEnum status = StaffStatusEnum.ACTIVE;

    @Column(name = "user_id")
    private Long userId;
}

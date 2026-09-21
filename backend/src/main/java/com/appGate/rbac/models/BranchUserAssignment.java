package com.appGate.rbac.models;

import com.appGate.rbac.enums.ApprovalScopeEnum;
import com.appGate.rbac.enums.LocationTypeEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Per-user branch-assignment metadata that has no home on {@link User} itself:
 * the warehouse the user works from, their in-branch job role, and their approval
 * scope. A user's actual branch membership still lives on {@link User#getBranch()};
 * this record layers the extra operational detail on top (one row per user).
 *
 * The warehouse is referenced softly (id + denormalised name) so the rbac module
 * does not depend on the warehouse module.
 */
@Entity
@Data
@Table(name = "branch_user_assignments")
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class BranchUserAssignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", referencedColumnName = "id")
    private Branch branch;

    @Column(name = "warehouse_id")
    private Long warehouseId;

    @Column(name = "warehouse_name")
    private String warehouseName;

    @Column(name = "job_role")
    private String jobRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type")
    private LocationTypeEnum locationType = LocationTypeEnum.HEAD_OFFICE;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_scope")
    private ApprovalScopeEnum approvalScope = ApprovalScopeEnum.BRANCH_ONLY;
}

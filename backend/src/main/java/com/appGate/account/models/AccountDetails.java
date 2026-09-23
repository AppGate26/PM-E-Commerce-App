package com.appGate.account.models;

import com.appGate.account.enums.GlPurpose;
import com.appGate.rbac.context.BranchOwned;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "account_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AccountDetails extends BaseEntity implements BranchOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_type_id", nullable = false)
    private Long accountTypeId;

    @Column(name = "control_account_id", nullable = false)
    private Long controlAccountId;

    @Column(name = "chart_of_account_id", nullable = false)
    private Long chartOfAccountId;

    @Column(name = "account_details_name", nullable = false)
    private String accountDetailsName;

    @Column(name = "account_details_code", unique = true)
    private String accountDetailsCode;

    /** The branch this GL belongs to. Head Office GLs carry the Head Office branch id. */
    @Column(name = "branch_id")
    private Long branchId;

    /** Optional role this GL plays in automatic postings; unique per branch. */
    @Enumerated(EnumType.STRING)
    @Column(name = "gl_purpose", length = 40)
    private GlPurpose glPurpose;
}

package com.appGate.account.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chart_of_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ChartOfAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_type_id", nullable = false)
    private Long accountTypeId;

    @Column(name = "control_account_id", nullable = false)
    private Long controlAccountId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "chart_of_account_id", unique = true)
    private String chartOfAccountId;
}

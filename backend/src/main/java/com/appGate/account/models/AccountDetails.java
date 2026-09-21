package com.appGate.account.models;

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
public class AccountDetails extends BaseEntity {

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
}

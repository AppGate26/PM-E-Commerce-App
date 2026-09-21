package com.appGate.rbac.models;

import com.appGate.rbac.enums.PermissionEnum;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.GenderEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Table(name = "users")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "resetOtp" })
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "phoneNumber", unique = true)
    private String phoneNumber;

    @Column(name = "firstName")
    private String firstName;

    @Column(name = "lastName")
    private String lastName;

    @Column(name = "address")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_id", referencedColumnName = "id")
    private State state;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lga_id", referencedColumnName = "id")
    private LGA lga;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", referencedColumnName = "id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", referencedColumnName = "id")
    private Branch branch;

    @Column(name = "password")
    private String password;

    @Column(name = "resetOtp")
    private String resetOtp;

    @Enumerated(EnumType.STRING)
    private RoleEnum role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private UserStatusEnum status = UserStatusEnum.ACTIVE;

    @Column(name = "department")
    private String department;

    @Column(name = "user_code")
    private String userCode;

    @ElementCollection(targetClass = PermissionEnum.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "permission", length = 50)
    private Set<PermissionEnum> permissions = new HashSet<>();

    // Sub-feature access denials, e.g. "accounting.staffpayroll". A denied feature
    // hides/blocks that specific screen for the user even when the parent module
    // permission is granted. Keys are defined by the frontend feature catalog.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_denied_features", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "feature_key", length = 100)
    private Set<String> deniedFeatures = new HashSet<>();
}

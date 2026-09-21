package com.appGate.customercare.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "social_media_links")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SocialMedia extends BaseEntity implements com.appGate.rbac.context.BranchOwned {

    /** The branch that owns the social interaction. */
    @jakarta.persistence.Column(name = "branch_id")
    private Long branchId;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "platform")
    private String platform;

    @Column(name = "url")
    private String url;

    @Column(name = "icon")
    private String icon;

    // Account handle / username / address used to log in to the social platform.
    @Column(name = "handle")
    private String handle;
}

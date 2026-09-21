package com.appGate.account.models;

import com.appGate.account.enums.VerificationStatus;
import com.appGate.account.enums.VerificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


import java.time.LocalDateTime;

@Entity
@Table(name = "user_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "bvnNumber", "ninNumber" })
public class UserVerification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false)
    private VerificationType verificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(name = "verification_value")
    private String verificationValue; // BVN number, NIN number, etc.

    @Column(name = "verification_reference")
    private String verificationReference; // Reference from third-party API

    @Column(name = "verification_response", length = 5000)
    private String verificationResponse; // Full API response (JSON)

    @Column(name = "verified_name")
    private String verifiedName; // Name from verification provider

    @Column(name = "verified_dob")
    private String verifiedDateOfBirth;

    @Column(name = "verified_phone")
    private String verifiedPhone;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    
    @Column(name = "personal_verification")
    private Boolean personalVerification = false;

    @Column(name = "personal_verification_date")
    private LocalDateTime personalVerificationDate;

    @Column(name = "employment_verified")
    private Boolean employmentVerified = false;

    @Column(name = "employment_verification_date")
    private LocalDateTime employmentVerificationDate;

    @Column(name = "bvn_verified")
    private Boolean bvnVerified = false;

    @Column(name = "bvn_verification_date")
    private LocalDateTime bvnVerificationDate;

    @Column(name = "bvn_number")
    private String bvnNumber;

    @Column(name = "nin_verified")
    private Boolean ninVerified = false;

    @Column(name = "nin_verification_date")
    private LocalDateTime ninVerificationDate;

    @Column(name = "nin_number")
    private String ninNumber;

    @Column(name = "bank_account_verified")
    private Boolean bankAccountVerified = false;

    @Column(name = "bank_account_verification_date")
    private LocalDateTime bankAccountVerificationDate;

    @Column(name = "payment_card_verified")
    private Boolean paymentCardVerified = false;

    @Column(name = "payment_card_verification_date")
    private LocalDateTime paymentCardVerificationDate;

    @Column(name = "terms_accepted")
    private Boolean termsAccepted = false;

    @Column(name = "terms_acceptance_date")
    private LocalDateTime termsAcceptanceDate;

    @Column(name = "terms_version")
    private String termsVersion;
}

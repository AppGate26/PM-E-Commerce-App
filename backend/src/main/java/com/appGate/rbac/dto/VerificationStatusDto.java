package com.appGate.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatusDto {
    private Long userId;
    private Boolean personalVerification;
    private LocalDateTime personalVerificationDate;
    private Boolean employmentVerified;
    private LocalDateTime employmentVerificationDate;
    private Boolean bvnVerified;
    private LocalDateTime bvnVerificationDate;
    private Boolean ninVerified;
    private LocalDateTime ninVerificationDate;
    private Boolean bankAccountVerified;
    private LocalDateTime bankAccountVerificationDate;
    private Boolean paymentCardVerified;
    private LocalDateTime paymentCardVerificationDate;
    private Boolean termsAccepted;
    private LocalDateTime termsAcceptanceDate;
    private String termsVersion;
}

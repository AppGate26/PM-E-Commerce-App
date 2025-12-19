package com.appGate.rbac.service;

import com.appGate.rbac.dto.VerificationStatusDto;
import com.appGate.account.models.UserVerification;
import com.appGate.account.repository.UserVerificationRepository;
import com.appGate.rbac.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserVerificationService {

    private final UserVerificationRepository verificationRepository;

    /**
     * Get user verification status
     */
    public BaseResponse getUserVerificationStatus(Long userId) {
        UserVerification verification = verificationRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .orElseGet(() -> createDefaultVerification(userId));

        VerificationStatusDto statusDto = mapToDto(verification);

        return new BaseResponse(HttpStatus.OK.value(), "successful", statusDto);
    }

    /**
     * Update personal verification status
     */
    public BaseResponse updatePersonalVerification(Long userId, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setPersonalVerification(verified);
        verification.setPersonalVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Personal verification updated", mapToDto(verification));
    }

    /**
     * Update employment verification status
     */
    public BaseResponse updateEmploymentVerification(Long userId, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setEmploymentVerified(verified);
        verification.setEmploymentVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Employment verification updated", mapToDto(verification));
    }

    /**
     * Update BVN verification status
     */
    public BaseResponse updateBvnVerification(Long userId, String bvnNumber, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setBvnVerified(verified);
        verification.setBvnNumber(bvnNumber);
        verification.setBvnVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "BVN verification updated", mapToDto(verification));
    }

    /**
     * Update NIN verification status
     */
    public BaseResponse updateNinVerification(Long userId, String ninNumber, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setNinVerified(verified);
        verification.setNinNumber(ninNumber);
        verification.setNinVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "NIN verification updated", mapToDto(verification));
    }

    /**
     * Update bank account verification status
     */
    public BaseResponse updateBankAccountVerification(Long userId, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setBankAccountVerified(verified);
        verification.setBankAccountVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Bank account verification updated", mapToDto(verification));
    }

    /**
     * Update payment card verification status
     */
    public BaseResponse updatePaymentCardVerification(Long userId, Boolean verified) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setPaymentCardVerified(verified);
        verification.setPaymentCardVerificationDate(verified ? LocalDateTime.now() : null);
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Payment card verification updated", mapToDto(verification));
    }

    /**
     * Accept terms and conditions
     */
    public BaseResponse acceptTerms(Long userId, String termsVersion) {
        UserVerification verification = getOrCreateVerification(userId);
        verification.setTermsAccepted(true);
        verification.setTermsVersion(termsVersion);
        verification.setTermsAcceptanceDate(LocalDateTime.now());
        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Terms accepted", mapToDto(verification));
    }

    /**
     * Get or create verification record for user
     */
    private UserVerification getOrCreateVerification(Long userId) {
        return verificationRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    UserVerification newVerification = createDefaultVerification(userId);
                    return verificationRepository.save(newVerification);
                });
    }

    /**
     * Create default verification record
     */
    private UserVerification createDefaultVerification(Long userId) {
        UserVerification verification = new UserVerification();
        verification.setUserId(userId);
        verification.setPersonalVerification(false);
        verification.setEmploymentVerified(false);
        verification.setBvnVerified(false);
        verification.setNinVerified(false);
        verification.setBankAccountVerified(false);
        verification.setPaymentCardVerified(false);
        verification.setTermsAccepted(false);
        return verification;
    }

    /**
     * Map entity to DTO
     */
    private VerificationStatusDto mapToDto(UserVerification verification) {
        return VerificationStatusDto.builder()
                .userId(verification.getUserId())
                .personalVerification(verification.getPersonalVerification())
                .personalVerificationDate(verification.getPersonalVerificationDate())
                .employmentVerified(verification.getEmploymentVerified())
                .employmentVerificationDate(verification.getEmploymentVerificationDate())
                .bvnVerified(verification.getBvnVerified())
                .bvnVerificationDate(verification.getBvnVerificationDate())
                .ninVerified(verification.getNinVerified())
                .ninVerificationDate(verification.getNinVerificationDate())
                .bankAccountVerified(verification.getBankAccountVerified())
                .bankAccountVerificationDate(verification.getBankAccountVerificationDate())
                .paymentCardVerified(verification.getPaymentCardVerified())
                .paymentCardVerificationDate(verification.getPaymentCardVerificationDate())
                .termsAccepted(verification.getTermsAccepted())
                .termsAcceptanceDate(verification.getTermsAcceptanceDate())
                .termsVersion(verification.getTermsVersion())
                .build();
    }
}

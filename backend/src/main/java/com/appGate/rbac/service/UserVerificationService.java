package com.appGate.rbac.service;

import com.appGate.rbac.dto.PersonalVerificationDto;
import com.appGate.rbac.dto.VerificationStatusDto;
import com.appGate.account.models.UserVerification;
import com.appGate.account.repository.UserVerificationRepository;
import com.appGate.rbac.models.Profile;
import com.appGate.rbac.models.EmploymentInformation;
import com.appGate.rbac.models.BankDetails;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.repository.ProfileRepository;
import com.appGate.rbac.repository.EmploymentInformationRepository;
import com.appGate.rbac.repository.BankDetailsRepository;
import com.appGate.rbac.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserVerificationService {

    private final UserVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final EmploymentInformationRepository employmentInformationRepository;
    private final BankDetailsRepository bankDetailsRepository;

    /**
     * Get user verification status
     */
    public BaseResponse getUserVerificationStatus(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
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
    public BaseResponse updatePersonalVerification(Long userId, PersonalVerificationDto dto) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        UserVerification verification = getOrCreateVerification(userId);
        verification.setPersonalVerification(true);
        verification.setPersonalVerificationDate(LocalDateTime.now());

        if (dto != null) {
            String verifiedName = buildFullName(dto.getFirstName(), dto.getLastName());
            if (verifiedName != null && !verifiedName.isBlank()) {
                verification.setVerifiedName(verifiedName);
            }
            if (dto.getDateOfBirth() != null) {
                verification.setVerifiedDateOfBirth(dto.getDateOfBirth());
            }
            if (dto.getPhoneNumber() != null) {
                verification.setVerifiedPhone(dto.getPhoneNumber());
            }
        }

        verificationRepository.save(verification);

        return new BaseResponse(HttpStatus.OK.value(), "Personal verification updated", mapToDto(verification));
    }

    private String buildFullName(String firstName, String lastName) {
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? null : full;
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
     * Verify if user has accepted payment terms
     */
    public BaseResponse verifyPaymentTermsAcceptance(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        UserVerification verification = verificationRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .orElseGet(() -> createDefaultVerification(userId));

        Boolean termsAccepted = verification.getTermsAccepted();
        String message = termsAccepted ? "User has accepted payment terms" : "User has not accepted payment terms";

        return new BaseResponse(HttpStatus.OK.value(), message,
                java.util.Map.of("termsAccepted", termsAccepted,
                                 "termsVersion", verification.getTermsVersion(),
                                 "acceptanceDate", verification.getTermsAcceptanceDate()));
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
     * Get current user's verification status
     */
    public BaseResponse getCurrentUserVerification(Long userId) {
        UserVerification verification = getOrCreateVerification(userId);
        VerificationStatusDto statusDto = mapToDto(verification);
        return new BaseResponse(HttpStatus.OK.value(), "Current user verification retrieved successfully", statusDto);
    }

    /**
     * Get personal information
     */
    public BaseResponse getPersonalInformation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        Profile profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Personal information not found", null);
        }
        return new BaseResponse(HttpStatus.OK.value(), "Personal information retrieved successfully", profile);
    }

    /**
     * Get employment information
     */
    public BaseResponse getEmploymentInformation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        EmploymentInformation employment = employmentInformationRepository.findByUserId(userId);
        if (employment == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Employment information not found", null);
        }
        return new BaseResponse(HttpStatus.OK.value(), "Employment information retrieved successfully", employment);
    }

    /**
     * Get BVN information
     */
    public BaseResponse getBvnInformation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        UserVerification verification = verificationRepository.findByUserIdAndVerificationType(userId,
                com.appGate.account.enums.VerificationType.BVN).orElse(null);
        if (verification == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "BVN information not found", null);
        }
        return new BaseResponse(HttpStatus.OK.value(), "BVN information retrieved successfully", verification);
    }

    /**
     * Get NIN information
     */
    public BaseResponse getNinInformation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        UserVerification verification = verificationRepository.findByUserIdAndVerificationType(userId,
                com.appGate.account.enums.VerificationType.NIN).orElse(null);
        if (verification == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "NIN information not found", null);
        }
        return new BaseResponse(HttpStatus.OK.value(), "NIN information retrieved successfully", verification);
    }

    /**
     * Get bank account information
     */
    public BaseResponse getBankAccountInformation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        BankDetails bankDetails = bankDetailsRepository.findByUserId(userId);
        if (bankDetails == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Bank account information not found", null);
        }
        return new BaseResponse(HttpStatus.OK.value(), "Bank account information retrieved successfully", bankDetails);
    }

    /**
     * Get all verification records
     */
    public BaseResponse getAllVerifications() {
        List<Profile> profiles = profileRepository.findAll();
        if (profiles.isEmpty()) {
            return new BaseResponse(HttpStatus.OK.value(), "No verification records found", java.util.Collections.emptyList());
        }
        return new BaseResponse(HttpStatus.OK.value(), "All verification records retrieved successfully", profiles);
    }

    /**
     * Verify bank account details against BVN/NIN
     */
    public BaseResponse verifyBankAccountDetails(Long userId, java.util.Map<String, String> request) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        String accountNumber = request.get("accountNumber");
        String bvn = request.get("bvn");
        String nin = request.get("nin");

        if ((accountNumber == null || accountNumber.isBlank()) &&
            (bvn == null || bvn.isBlank()) &&
            (nin == null || nin.isBlank())) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                    "At least one of accountNumber, BVN, or NIN is required", null);
        }

        UserVerification verification = getOrCreateVerification(userId);

        java.util.Map<String, Object> verificationData = new java.util.HashMap<>();
        verificationData.put("accountNumber", accountNumber);
        verificationData.put("bvnMatch", true);
        verificationData.put("ninMatch", true);

        if (bvn != null && !bvn.isBlank()) {
            verificationData.put("bvnProvided", bvn);
            if (verification.getBvnNumber() != null) {
                boolean bvnMatches = verification.getBvnNumber().equals(bvn);
                verificationData.put("bvnMatch", bvnMatches);
            }
        }

        if (nin != null && !nin.isBlank()) {
            verificationData.put("ninProvided", nin);
            if (verification.getNinNumber() != null) {
                boolean ninMatches = verification.getNinNumber().equals(nin);
                verificationData.put("ninMatch", ninMatches);
            }
        }

        boolean allDetailsMatch = (Boolean) verificationData.getOrDefault("bvnMatch", true) &&
                                  (Boolean) verificationData.getOrDefault("ninMatch", true);

        verification.setBankAccountVerified(allDetailsMatch);
        if (allDetailsMatch) {
            verification.setBankAccountVerificationDate(java.time.LocalDateTime.now());
        }
        verificationRepository.save(verification);

        verificationData.put("verified", allDetailsMatch);
        verificationData.put("userId", userId);

        String message = allDetailsMatch ? "Bank account details verified successfully" :
                        "Bank account details verification failed - details do not match";

        return new BaseResponse(HttpStatus.OK.value(), message, verificationData);
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

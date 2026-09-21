package com.appGate.account.service;

import com.appGate.account.dto.VerifyBvnDto;
import com.appGate.account.dto.VerifyNinDto;
import com.appGate.account.enums.VerificationStatus;
import com.appGate.account.enums.VerificationType;
import com.appGate.account.models.UserVerification;
import com.appGate.account.repository.UserVerificationRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountVerificationService {

    private final UserVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${verification.bvn.api.url:https://api.youverify.co}")
    private String bvnApiUrl;

    @Value("${verification.bvn.api.key:your_api_key}")
    private String bvnApiKey;

    @Value("${verification.nin.api.url:https://api.youverify.co}")
    private String ninApiUrl;

    @Value("${verification.nin.api.key:your_api_key}")
    private String ninApiKey;

    @Transactional
    public BaseResponse verifyBVN(VerifyBvnDto dto) {
        try {
            // Check if user already has verified BVN
            boolean alreadyVerified = verificationRepository.existsByUserIdAndVerificationTypeAndStatus(
                    dto.getUserId(), VerificationType.BVN, VerificationStatus.VERIFIED);

            if (alreadyVerified) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "BVN already verified for this user", null);
            }

            // Create verification record
            UserVerification verification = new UserVerification();
            verification.setUserId(dto.getUserId());
            verification.setVerificationType(VerificationType.BVN);
            verification.setStatus(VerificationStatus.IN_PROGRESS);
            verification.setVerificationValue(dto.getBvn());
            verification.setVerificationReference(generateVerificationReference());
            verification.setRetryCount(0);

            UserVerification savedVerification = verificationRepository.save(verification);

            // Call third-party BVN verification API
            // Note: This is a placeholder - actual API integration depends on provider
            try {
                Map<String, Object> apiResponse = callBvnVerificationApi(dto);

                if (apiResponse != null && "success".equals(apiResponse.get("status"))) {
                    // Update verification as successful
                    savedVerification.setStatus(VerificationStatus.VERIFIED);
                    savedVerification.setVerifiedAt(LocalDateTime.now());
                    savedVerification.setVerifiedName(
                            apiResponse.get("firstName") + " " + apiResponse.get("lastName"));
                    savedVerification.setVerifiedDateOfBirth((String) apiResponse.get("dateOfBirth"));
                    savedVerification.setVerifiedPhone((String) apiResponse.get("phoneNumber"));
                    savedVerification.setVerificationResponse(apiResponse.toString());

                    verificationRepository.save(savedVerification);

                    return new BaseResponse(HttpStatus.OK.value(),
                            "BVN verified successfully", savedVerification);
                } else {
                    // Verification failed
                    savedVerification.setStatus(VerificationStatus.FAILED);
                    savedVerification.setFailureReason("BVN verification failed: " +
                            (apiResponse != null ? apiResponse.get("message") : "Unknown error"));

                    verificationRepository.save(savedVerification);

                    return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                            "BVN verification failed", savedVerification);
                }

            } catch (Exception apiException) {
                // API call failed
                savedVerification.setStatus(VerificationStatus.FAILED);
                savedVerification.setFailureReason("API error: " + apiException.getMessage());
                verificationRepository.save(savedVerification);

                return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Verification service unavailable: " + apiException.getMessage(), null);
            }

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to verify BVN: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse verifyNIN(VerifyNinDto dto) {
        try {
            // Check if user already has verified NIN
            boolean alreadyVerified = verificationRepository.existsByUserIdAndVerificationTypeAndStatus(
                    dto.getUserId(), VerificationType.NIN, VerificationStatus.VERIFIED);

            if (alreadyVerified) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "NIN already verified for this user", null);
            }

            // Create verification record
            UserVerification verification = new UserVerification();
            verification.setUserId(dto.getUserId());
            verification.setVerificationType(VerificationType.NIN);
            verification.setStatus(VerificationStatus.IN_PROGRESS);
            verification.setVerificationValue(dto.getNin());
            verification.setVerificationReference(generateVerificationReference());
            verification.setRetryCount(0);

            UserVerification savedVerification = verificationRepository.save(verification);

            // Call third-party NIN verification API
            try {
                Map<String, Object> apiResponse = callNinVerificationApi(dto);

                if (apiResponse != null && "success".equals(apiResponse.get("status"))) {
                    String recordFirstName = String.valueOf(apiResponse.getOrDefault("firstName", ""));
                    String recordLastName = String.valueOf(apiResponse.getOrDefault("lastName", ""));

                    // Confirm the name registered to the NIN matches the name entered on the form.
                    if (!namesMatch(dto.getFirstName(), dto.getLastName(), recordFirstName, recordLastName)) {
                        savedVerification.setStatus(VerificationStatus.FAILED);
                        savedVerification.setVerifiedName((recordFirstName + " " + recordLastName).trim());
                        savedVerification.setFailureReason(
                                "Name on the form does not match the name registered to this NIN");
                        savedVerification.setVerificationResponse(apiResponse.toString());
                        verificationRepository.save(savedVerification);

                        return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                                "NIN name mismatch: the name on the form does not match the NIN record",
                                savedVerification);
                    }

                    // Update verification as successful
                    savedVerification.setStatus(VerificationStatus.VERIFIED);
                    savedVerification.setVerifiedAt(LocalDateTime.now());
                    savedVerification.setVerifiedName(
                            apiResponse.get("firstName") + " " + apiResponse.get("lastName"));
                    savedVerification.setVerifiedDateOfBirth((String) apiResponse.get("dateOfBirth"));
                    savedVerification.setVerificationResponse(apiResponse.toString());

                    verificationRepository.save(savedVerification);

                    return new BaseResponse(HttpStatus.OK.value(),
                            "NIN verified successfully", savedVerification);
                } else {
                    // Verification failed
                    savedVerification.setStatus(VerificationStatus.FAILED);
                    savedVerification.setFailureReason("NIN verification failed: " +
                            (apiResponse != null ? apiResponse.get("message") : "Unknown error"));

                    verificationRepository.save(savedVerification);

                    return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                            "NIN verification failed", savedVerification);
                }

            } catch (Exception apiException) {
                savedVerification.setStatus(VerificationStatus.FAILED);
                savedVerification.setFailureReason("API error: " + apiException.getMessage());
                verificationRepository.save(savedVerification);

                return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Verification service unavailable: " + apiException.getMessage(), null);
            }

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to verify NIN: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserVerifications(Long userId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            var verifications = verificationRepository.findByUserId(userId);

            return new BaseResponse(HttpStatus.OK.value(),
                    "User verifications retrieved successfully", verifications);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve verifications: " + e.getMessage(), null);
        }
    }

    public BaseResponse getVerificationStatus(Long userId, VerificationType type) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            var verification = verificationRepository.findByUserIdAndVerificationType(userId, type);

            if (verification.isEmpty()) {
                return new BaseResponse(HttpStatus.NOT_FOUND.value(),
                        "No verification found for this type", null);
            }

            return new BaseResponse(HttpStatus.OK.value(),
                    "Verification status retrieved successfully", verification.get());

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve verification status: " + e.getMessage(), null);
        }
    }

    /**
     * Lightweight check for the account flow: is this user verified at all?
     * A user counts as verified if any verification type (BVN/NIN/EMAIL/PHONE) is VERIFIED.
     * Returns an overall {@code verified} boolean plus the list of types that are verified.
     * Also checks boolean verification fields for consistency with UserVerificationService.
     */
    public BaseResponse isUserVerified(Long userId) {
        try {
            if (!userRepository.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            List<UserVerification> verifiedRecords =
                    verificationRepository.findByUserIdAndStatus(userId, VerificationStatus.VERIFIED);

            List<VerificationType> verifiedTypes = verifiedRecords.stream()
                    .map(UserVerification::getVerificationType)
                    .distinct()
                    .toList();

            // Also check boolean verification flags for backward compatibility
            List<String> verifiedTypeNames = new java.util.ArrayList<>();
            verifiedTypeNames.addAll(verifiedTypes.stream().map(VerificationType::toString).toList());

            UserVerification userVerif = verificationRepository.findByUserId(userId)
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (userVerif != null) {
                if (userVerif.getBvnVerified()) verifiedTypeNames.add("BVN");
                if (userVerif.getNinVerified()) verifiedTypeNames.add("NIN");
                if (userVerif.getPersonalVerification()) verifiedTypeNames.add("PERSONAL");
                if (userVerif.getEmploymentVerified()) verifiedTypeNames.add("EMPLOYMENT");
                if (userVerif.getBankAccountVerified()) verifiedTypeNames.add("BANK_ACCOUNT");
                if (userVerif.getPaymentCardVerified()) verifiedTypeNames.add("PAYMENT_CARD");
            }

            boolean verified = !verifiedTypeNames.isEmpty();
            verifiedTypeNames = verifiedTypeNames.stream().distinct().toList();

            Map<String, Object> data = new HashMap<>();
            data.put("userId", userId);
            data.put("verified", verified);
            data.put("verifiedTypes", verifiedTypeNames);

            return new BaseResponse(HttpStatus.OK.value(),
                    verified ? "User is verified" : "User is not verified", data);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to check verification status: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse retryVerification(Long verificationId) {
        try {
            UserVerification verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new RuntimeException("Verification not found"));

            if (verification.getStatus() == VerificationStatus.VERIFIED) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Verification already completed", null);
            }

            verification.setStatus(VerificationStatus.PENDING);
            verification.setRetryCount(verification.getRetryCount() + 1);

            verificationRepository.save(verification);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Verification retry initiated", verification);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retry verification: " + e.getMessage(), null);
        }
    }

    // Placeholder methods for third-party API calls
    // Replace with actual API integration
    private Map<String, Object> callBvnVerificationApi(VerifyBvnDto dto) {
        // TODO: Implement actual API call to BVN verification provider
        // Example providers: Youverify, Smile Identity, Prembly

        // Placeholder response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("firstName", dto.getFirstName());
        response.put("lastName", dto.getLastName());
        response.put("dateOfBirth", dto.getDateOfBirth());
        response.put("phoneNumber", dto.getPhoneNumber());

        /* Actual implementation would look like:
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + bvnApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("bvn", dto.getBvn());
        requestBody.put("firstName", dto.getFirstName());
        requestBody.put("lastName", dto.getLastName());
        requestBody.put("dateOfBirth", dto.getDateOfBirth());

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> apiResponse = restTemplate.postForEntity(
            bvnApiUrl + "/v1/verify/bvn", request, Map.class);

        return apiResponse.getBody();
        */

        return response;
    }

    private Map<String, Object> callNinVerificationApi(VerifyNinDto dto) {
        // TODO: Implement actual API call to NIN verification provider

        // Placeholder response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("firstName", dto.getFirstName());
        response.put("lastName", dto.getLastName());
        response.put("dateOfBirth", dto.getDateOfBirth());

        return response;
    }

    private String generateVerificationReference() {
        return "VER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Order- and middle-name-tolerant comparison of the form name against the identity record name.
    // Passes when one name's tokens are a subset of the other's (e.g. form "John Doe" vs record
    // "John Michael Doe").
    private boolean namesMatch(String formFirst, String formLast, String recordFirst, String recordLast) {
        java.util.Set<String> formTokens = nameTokens(formFirst + " " + formLast);
        java.util.Set<String> recordTokens = nameTokens(recordFirst + " " + recordLast);
        if (formTokens.isEmpty() || recordTokens.isEmpty()) {
            return false;
        }
        return recordTokens.containsAll(formTokens) || formTokens.containsAll(recordTokens);
    }

    private java.util.Set<String> nameTokens(String name) {
        java.util.Set<String> tokens = new java.util.HashSet<>();
        if (name == null) {
            return tokens;
        }
        for (String part : name.trim().toLowerCase().split("\\s+")) {
            if (!part.isBlank()) {
                tokens.add(part);
            }
        }
        return tokens;
    }

    public BaseResponse getVerificationCenterUsers() {
        try {
            List<UserVerification> allVerifications = verificationRepository.findAll();

            if (allVerifications.isEmpty()) {
                return new BaseResponse(HttpStatus.OK.value(),
                        "No verification records found", java.util.Collections.emptyList());
            }

            return new BaseResponse(HttpStatus.OK.value(),
                    "Verification center users retrieved successfully", allVerifications);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve verification center users: " + e.getMessage(), null);
        }
    }
}


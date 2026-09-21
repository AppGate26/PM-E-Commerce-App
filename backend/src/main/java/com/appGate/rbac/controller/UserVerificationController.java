package com.appGate.rbac.controller;

import com.appGate.rbac.dto.PersonalVerificationDto;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.UserVerificationService;
import com.appGate.rbac.util.JwtUtils;
import com.appGate.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/verification")
@RequiredArgsConstructor
public class UserVerificationController {

    private final UserVerificationService verificationService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    /**
     * Get current user's verification status
     * GET /api/users/verification/me
     */
    @GetMapping("/me")
    public BaseResponse getCurrentUserVerification(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getCurrentUserVerification(userId);
    }

    /**
     * Get user verification status (admin/other access)
     * GET /api/users/verification/{userId}
     */
    @GetMapping("/{userId}")
    public BaseResponse getUserVerificationStatus(@PathVariable Long userId) {
        return verificationService.getUserVerificationStatus(userId);
    }

    /**
     * Get current user's personal information
     * GET /api/users/verification/personal-information/me
     */
    @GetMapping("/personal-information/me")
    public BaseResponse getCurrentUserPersonalInformation(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getPersonalInformation(userId);
    }

    /**
     * Get user's personal information
     * GET /api/users/verification/personal-information/{userId}
     */
    @GetMapping("/personal-information/{userId}")
    public BaseResponse getUserPersonalInformation(@PathVariable Long userId) {
        return verificationService.getPersonalInformation(userId);
    }

    /**
     * Get current user's employment information
     * GET /api/users/verification/employment/me
     */
    @GetMapping("/employment/me")
    public BaseResponse getCurrentUserEmploymentInformation(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getEmploymentInformation(userId);
    }

    /**
     * Get user's employment information
     * GET /api/users/verification/employment/{userId}
     */
    @GetMapping("/employment/{userId}")
    public BaseResponse getUserEmploymentInformation(@PathVariable Long userId) {
        return verificationService.getEmploymentInformation(userId);
    }

    /**
     * Get current user's BVN information
     * GET /api/users/verification/bvn/me
     */
    @GetMapping("/bvn/me")
    public BaseResponse getCurrentUserBvnInformation(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getBvnInformation(userId);
    }

    /**
     * Get user's BVN information
     * GET /api/users/verification/bvn/{userId}
     */
    @GetMapping("/bvn/{userId}")
    public BaseResponse getUserBvnInformation(@PathVariable Long userId) {
        return verificationService.getBvnInformation(userId);
    }

    /**
     * Get current user's NIN information
     * GET /api/users/verification/nin/me
     */
    @GetMapping("/nin/me")
    public BaseResponse getCurrentUserNinInformation(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getNinInformation(userId);
    }

    /**
     * Get user's NIN information
     * GET /api/users/verification/nin/{userId}
     */
    @GetMapping("/nin/{userId}")
    public BaseResponse getUserNinInformation(@PathVariable Long userId) {
        return verificationService.getNinInformation(userId);
    }

    /**
     * Get current user's bank account information
     * GET /api/users/verification/bank-account/me
     */
    @GetMapping("/bank-account/me")
    public BaseResponse getCurrentUserBankAccountInformation(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.getBankAccountInformation(userId);
    }

    /**
     * Get user's bank account information
     * GET /api/users/verification/bank-account/{userId}
     */
    @GetMapping("/bank-account/{userId}")
    public BaseResponse getUserBankAccountInformation(@PathVariable Long userId) {
        return verificationService.getBankAccountInformation(userId);
    }

    /**
     * Get all verification records (verification center)
     * GET /api/users/verification/center/all
     */
    @GetMapping("/center/all")
    public BaseResponse getAllVerifications() {
        return verificationService.getAllVerifications();
    }

    /**
     * Update personal verification
     * PUT /api/users/verification/{userId}/personal
     */
    @PutMapping("/{userId}/personal")
    public BaseResponse updatePersonalVerification(
            @PathVariable Long userId,
            @RequestBody PersonalVerificationDto dto) {
        return verificationService.updatePersonalVerification(userId, dto);
    }

    /**
     * Update employment verification
     * PUT /api/users/verification/{userId}/employment
     */
    @PutMapping("/{userId}/employment")
    public BaseResponse updateEmploymentVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> request) {
        Boolean verified = request.getOrDefault("verified", false);
        return verificationService.updateEmploymentVerification(userId, verified);
    }

    /**
     * Update BVN verification
     * PUT /api/users/verification/{userId}/bvn
     */
    @PutMapping("/{userId}/bvn")
    public BaseResponse updateBvnVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        String bvnNumber = (String) request.get("bvnNumber");
        Boolean verified = (Boolean) request.getOrDefault("verified", false);
        return verificationService.updateBvnVerification(userId, bvnNumber, verified);
    }

    /**
     * Update NIN verification
     * PUT /api/users/verification/{userId}/nin
     */
    @PutMapping("/{userId}/nin")
    public BaseResponse updateNinVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        String ninNumber = (String) request.get("ninNumber");
        Boolean verified = (Boolean) request.getOrDefault("verified", false);
        return verificationService.updateNinVerification(userId, ninNumber, verified);
    }

    /**
     * Update bank account verification
     * PUT /api/users/verification/{userId}/bank-account
     */
    @PutMapping("/{userId}/bank-account")
    public BaseResponse updateBankAccountVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> request) {
        Boolean verified = request.getOrDefault("verified", false);
        return verificationService.updateBankAccountVerification(userId, verified);
    }

    /**
     * Update payment card verification
     * PUT /api/users/verification/{userId}/payment-card
     */
    @PutMapping("/{userId}/payment-card")
    public BaseResponse updatePaymentCardVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> request) {
        Boolean verified = request.getOrDefault("verified", false);
        return verificationService.updatePaymentCardVerification(userId, verified);
    }

    /**
     * Accept terms and conditions
     * POST /api/users/verification/{userId}/accept-terms
     */
    @PostMapping("/{userId}/accept-terms")
    public BaseResponse acceptTerms(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        String termsVersion = request.getOrDefault("termsVersion", "1.0");
        return verificationService.acceptTerms(userId, termsVersion);
    }

    /**
     * Verify if user has accepted payment terms
     * GET /api/users/verification/{userId}/payment-terms
     */
    @GetMapping("/{userId}/payment-terms")
    public BaseResponse verifyPaymentTermsAcceptance(@PathVariable Long userId) {
        return verificationService.verifyPaymentTermsAcceptance(userId);
    }

    /**
     * Verify if current user has accepted payment terms
     * GET /api/users/verification/payment-terms/me
     */
    @GetMapping("/payment-terms/me")
    public BaseResponse verifyCurrentUserPaymentTermsAcceptance(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return verificationService.verifyPaymentTermsAcceptance(userId);
    }

    /**
     * Verify bank account details against BVN/NIN
     * POST /api/users/verification/{userId}/verify-bank-account
     * Body: { "accountNumber": "string", "bvn": "string", "nin": "string" }
     */
    @PostMapping("/{userId}/verify-bank-account")
    public BaseResponse verifyBankAccountDetails(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        return verificationService.verifyBankAccountDetails(userId, request);
    }

    /**
     * Verify current user's bank account details against BVN/NIN
     * POST /api/users/verification/bank-account/verify/me
     */
    @PostMapping("/bank-account/verify/me")
    public BaseResponse verifyCurrentUserBankAccountDetails(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {
        Long userId = extractUserId(token);
        return verificationService.verifyBankAccountDetails(userId, request);
    }

    private Long extractUserId(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String email = jwtUtils.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}

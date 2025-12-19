package com.appGate.rbac.controller;

import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.UserVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/verification")
@RequiredArgsConstructor
public class UserVerificationController {

    private final UserVerificationService verificationService;

    /**
     * Get user verification status
     * GET /api/users/verification/{userId}
     */
    @GetMapping("/{userId}")
    public BaseResponse getUserVerificationStatus(@PathVariable Long userId) {
        return verificationService.getUserVerificationStatus(userId);
    }

    /**
     * Update personal verification
     * PUT /api/users/verification/{userId}/personal
     */
    @PutMapping("/{userId}/personal")
    public BaseResponse updatePersonalVerification(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> request) {
        Boolean verified = request.getOrDefault("verified", false);
        return verificationService.updatePersonalVerification(userId, verified);
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
}

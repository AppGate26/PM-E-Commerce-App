package com.appGate.recovery.service;

import com.appGate.recovery.dto.InitiateRecoveryDto;
import com.appGate.recovery.dto.ResetPasswordDto;
import com.appGate.recovery.dto.VerifyRecoveryDto;
import com.appGate.recovery.enums.RecoveryStatus;
import com.appGate.recovery.enums.RecoveryType;
import com.appGate.recovery.models.RecoveryRequest;
import com.appGate.recovery.repository.RecoveryRequestRepository;
import com.appGate.recovery.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final RecoveryRequestRepository recoveryRepository;
    private static final int TOKEN_VALIDITY_HOURS = 24;
    private static final int CODE_VALIDITY_MINUTES = 15;
    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public BaseResponse initiateRecovery(InitiateRecoveryDto dto, String ipAddress, String userAgent) {
        try {
            // Check rate limiting - max 3 requests per hour
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            Long recentRequests = recoveryRepository.countByUserIdAndRecoveryTypeAndCreatedAtAfter(
                    null, dto.getRecoveryType(), oneHourAgo);

            if (recentRequests >= 3) {
                return new BaseResponse(HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Too many recovery requests. Please try again later.", null);
            }

            // TODO: Fetch user by email/phone from user service
            // For now, using placeholder userId
            Long userId = 1L; // This should come from user service

            RecoveryRequest request = new RecoveryRequest();
            request.setUserId(userId);
            request.setEmail(dto.getEmail());
            request.setPhone(dto.getPhone());
            request.setRecoveryType(dto.getRecoveryType());
            request.setStatus(RecoveryStatus.PENDING);
            request.setIpAddress(ipAddress);
            request.setUserAgent(userAgent);
            request.setAttemptCount(0);
            request.setMaxAttempts(5);

            // Generate token and code
            if (dto.getRecoveryType() == RecoveryType.PASSWORD_RESET) {
                // For password reset, use token (email link)
                request.setRecoveryToken(generateRecoveryToken());
                request.setTokenExpiresAt(LocalDateTime.now().plusHours(TOKEN_VALIDITY_HOURS));
            } else {
                // For other types, use 6-digit code (SMS/Email)
                request.setRecoveryCode(generateRecoveryCode());
                request.setTokenExpiresAt(LocalDateTime.now().plusMinutes(CODE_VALIDITY_MINUTES));
            }

            RecoveryRequest savedRequest = recoveryRepository.save(request);

            // TODO: Send email or SMS with recovery link/code
            // This would integrate with email-service
            savedRequest.setStatus(RecoveryStatus.SENT);
            recoveryRepository.save(savedRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("recoveryId", savedRequest.getId());
            response.put("expiresAt", savedRequest.getTokenExpiresAt());

            if (dto.getRecoveryType() == RecoveryType.PASSWORD_RESET) {
                response.put("message", "Password reset link sent to your email");
                response.put("token", savedRequest.getRecoveryToken()); // In production, don't return this
            } else {
                response.put("message", "Recovery code sent to your email/phone");
                response.put("code", savedRequest.getRecoveryCode()); // In production, don't return this
            }

            return new BaseResponse(HttpStatus.OK.value(),
                    "Recovery request initiated successfully", response);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to initiate recovery: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse verifyRecoveryToken(VerifyRecoveryDto dto) {
        try {
            // Try finding by token first
            RecoveryRequest request = recoveryRepository.findByRecoveryToken(dto.getTokenOrCode())
                    .orElse(null);

            // If not found, try by code
            if (request == null) {
                request = recoveryRepository.findByRecoveryCode(dto.getTokenOrCode())
                        .orElseThrow(() -> new RuntimeException("Invalid recovery token or code"));
            }

            // Check if expired
            if (request.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
                request.setStatus(RecoveryStatus.EXPIRED);
                recoveryRepository.save(request);
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Recovery token/code has expired", null);
            }

            // Check max attempts
            if (request.getAttemptCount() >= request.getMaxAttempts()) {
                request.setStatus(RecoveryStatus.FAILED);
                recoveryRepository.save(request);
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Maximum verification attempts exceeded", null);
            }

            // Increment attempt count
            request.setAttemptCount(request.getAttemptCount() + 1);

            // Mark as verified
            request.setStatus(RecoveryStatus.VERIFIED);
            request.setVerifiedAt(LocalDateTime.now());

            RecoveryRequest updatedRequest = recoveryRepository.save(request);

            Map<String, Object> response = new HashMap<>();
            response.put("recoveryId", updatedRequest.getId());
            response.put("userId", updatedRequest.getUserId());
            response.put("recoveryType", updatedRequest.getRecoveryType());
            response.put("verified", true);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Recovery token verified successfully", response);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to verify recovery token: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse resetPassword(ResetPasswordDto dto) {
        try {
            // Validate passwords match
            if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Passwords do not match", null);
            }

            RecoveryRequest request = recoveryRepository.findByRecoveryToken(dto.getToken())
                    .orElseThrow(() -> new RuntimeException("Invalid recovery token"));

            // Check if verified
            if (request.getStatus() != RecoveryStatus.VERIFIED) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Recovery token not verified", null);
            }

            // Check if expired
            if (request.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
                request.setStatus(RecoveryStatus.EXPIRED);
                recoveryRepository.save(request);
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Recovery token has expired", null);
            }

            // TODO: Call user service to update password
            // This would make a REST call to account-service/user-service
            // For now, simulating success

            // Mark as completed
            request.setStatus(RecoveryStatus.COMPLETED);
            request.setCompletedAt(LocalDateTime.now());
            recoveryRepository.save(request);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Password reset successfully", null);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to reset password: " + e.getMessage(), null);
        }
    }

    public BaseResponse getRecoveryStatus(String tokenOrCode) {
        try {
            RecoveryRequest request = recoveryRepository.findByRecoveryToken(tokenOrCode)
                    .orElse(null);

            if (request == null) {
                request = recoveryRepository.findByRecoveryCode(tokenOrCode)
                        .orElseThrow(() -> new RuntimeException("Recovery request not found"));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("recoveryId", request.getId());
            response.put("recoveryType", request.getRecoveryType());
            response.put("status", request.getStatus());
            response.put("expiresAt", request.getTokenExpiresAt());
            response.put("attemptCount", request.getAttemptCount());
            response.put("maxAttempts", request.getMaxAttempts());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Recovery status retrieved successfully", response);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to get recovery status: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse resendRecoveryCode(Long recoveryId) {
        try {
            RecoveryRequest request = recoveryRepository.findById(recoveryId)
                    .orElseThrow(() -> new RuntimeException("Recovery request not found"));

            // Check if already completed
            if (request.getStatus() == RecoveryStatus.COMPLETED) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Recovery already completed", null);
            }

            // Generate new code
            request.setRecoveryCode(generateRecoveryCode());
            request.setTokenExpiresAt(LocalDateTime.now().plusMinutes(CODE_VALIDITY_MINUTES));
            request.setStatus(RecoveryStatus.PENDING);
            request.setAttemptCount(0);

            RecoveryRequest updatedRequest = recoveryRepository.save(request);

            // TODO: Resend email/SMS
            updatedRequest.setStatus(RecoveryStatus.SENT);
            recoveryRepository.save(updatedRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Recovery code resent successfully");
            response.put("expiresAt", updatedRequest.getTokenExpiresAt());
            response.put("code", updatedRequest.getRecoveryCode()); // In production, don't return this

            return new BaseResponse(HttpStatus.OK.value(),
                    "Recovery code resent successfully", response);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to resend recovery code: " + e.getMessage(), null);
        }
    }

    @Transactional
    public void expireOldTokens() {
        // Scheduled task to expire old tokens
        LocalDateTime now = LocalDateTime.now();
        var expiredRequests = recoveryRepository.findByStatusAndTokenExpiresAtBefore(
                RecoveryStatus.SENT, now);

        for (RecoveryRequest request : expiredRequests) {
            request.setStatus(RecoveryStatus.EXPIRED);
        }

        if (!expiredRequests.isEmpty()) {
            recoveryRepository.saveAll(expiredRequests);
        }
    }

    private String generateRecoveryToken() {
        return UUID.randomUUID().toString();
    }

    private String generateRecoveryCode() {
        int code = 100000 + random.nextInt(900000); // 6-digit code
        return String.valueOf(code);
    }
}

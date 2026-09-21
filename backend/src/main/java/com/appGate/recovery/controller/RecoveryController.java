package com.appGate.recovery.controller;

import com.appGate.recovery.dto.InitiateRecoveryDto;
import com.appGate.recovery.dto.ResetPasswordDto;
import com.appGate.recovery.dto.VerifyRecoveryDto;
import com.appGate.recovery.response.BaseResponse;
import com.appGate.recovery.service.RecoveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recovery")
@RequiredArgsConstructor
public class RecoveryController {

    private final RecoveryService recoveryService;

    @PostMapping("/initiate")
    public BaseResponse initiateRecovery(
            @Valid @RequestBody InitiateRecoveryDto dto,
            HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        return recoveryService.initiateRecovery(dto, ipAddress, userAgent);
    }

    @PostMapping("/verify")
    public BaseResponse verifyRecoveryToken(@Valid @RequestBody VerifyRecoveryDto dto) {
        return recoveryService.verifyRecoveryToken(dto);
    }

    @PostMapping("/reset-password")
    public BaseResponse resetPassword(@Valid @RequestBody ResetPasswordDto dto) {
        return recoveryService.resetPassword(dto);
    }

    @GetMapping("/status/{tokenOrCode}")
    public BaseResponse getRecoveryStatus(@PathVariable String tokenOrCode) {
        return recoveryService.getRecoveryStatus(tokenOrCode);
    }

    @PostMapping("/{recoveryId}/resend")
    public BaseResponse resendRecoveryCode(@PathVariable Long recoveryId) {
        return recoveryService.resendRecoveryCode(recoveryId);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}

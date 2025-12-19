package com.appGate.account.controller;

import com.appGate.account.dto.VerifyBvnDto;
import com.appGate.account.dto.VerifyNinDto;
import com.appGate.account.enums.VerificationType;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AccountVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class AccountVerificationController {

    private final AccountVerificationService verificationService;

    @PostMapping("/bvn")
    public BaseResponse verifyBVN(@Valid @RequestBody VerifyBvnDto dto) {
        return verificationService.verifyBVN(dto);
    }

    @PostMapping("/nin")
    public BaseResponse verifyNIN(@Valid @RequestBody VerifyNinDto dto) {
        return verificationService.verifyNIN(dto);
    }

    @GetMapping("/user/{userId}")
    public BaseResponse getUserVerifications(@PathVariable Long userId) {
        return verificationService.getUserVerifications(userId);
    }

    @GetMapping("/user/{userId}/type/{type}")
    public BaseResponse getVerificationStatus(
            @PathVariable Long userId,
            @PathVariable VerificationType type) {
        return verificationService.getVerificationStatus(userId, type);
    }

    @PutMapping("/{verificationId}/retry")
    public BaseResponse retryVerification(@PathVariable Long verificationId) {
        return verificationService.retryVerification(verificationId);
    }
}

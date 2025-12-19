package com.appGate.rbac.controller;

import com.appGate.account.dto.VerificationResponse;
import com.appGate.account.service.VerificationService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
@Validated
public class BankVerificationController {

    private final VerificationService verificationService;

    @GetMapping("/bvn/{bvn}")
    public ResponseEntity<VerificationResponse> verifyBvn(
            @PathVariable
            @NotBlank(message = "BVN is required")
            @Pattern(regexp = "\\d{11}", message = "BVN must be exactly 11 digits")
            String bvn) {

        VerificationResponse result = verificationService.verifyBvn(bvn);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/nin/{nin}")
    public ResponseEntity<VerificationResponse> verifyNin(
            @PathVariable
            @NotBlank(message = "NIN is required")
            @Pattern(regexp = "\\d{11}", message = "NIN must be exactly 11 digits")
            String nin) {

        VerificationResponse result = verificationService.verifyNin(nin);
        return ResponseEntity.ok(result);
    }
}

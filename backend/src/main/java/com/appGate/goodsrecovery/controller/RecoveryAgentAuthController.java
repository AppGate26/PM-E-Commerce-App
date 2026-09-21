package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.dto.RecoveryAgentLoginDto;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.RecoveryAgentAuthService;
import com.appGate.goodsrecovery.dto.DeliveryChangePasswordDto;
import com.appGate.goodsrecovery.dto.ForgotPasswordDto;
import com.appGate.goodsrecovery.dto.ResetPasswordDto;


import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goods-recovery/auth")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class RecoveryAgentAuthController {

    private final RecoveryAgentAuthService recoveryAgentAuthService;

    public RecoveryAgentAuthController(RecoveryAgentAuthService recoveryAgentAuthService) {
        this.recoveryAgentAuthService = recoveryAgentAuthService;
    }

    @PostMapping("/login")
    public BaseResponse login(@Valid @RequestBody RecoveryAgentLoginDto loginDto) {
        return recoveryAgentAuthService.login(loginDto);
    }

    @PutMapping("/change-password/{riderId}")
    public BaseResponse changePassword(
            @PathVariable Long riderId,
            @Valid @RequestBody DeliveryChangePasswordDto dto) {
        return recoveryAgentAuthService.changePassword(riderId, dto);
    }

    @PostMapping("/forgot-password")
    public BaseResponse forgotPassword(@Valid @RequestBody ForgotPasswordDto dto) {
        return recoveryAgentAuthService.forgotPassword(dto);
    }

    @PostMapping("/reset-password")
    public BaseResponse resetPassword(@RequestBody ResetPasswordDto resetPasswordDto) {
        return recoveryAgentAuthService.resetPassword(resetPasswordDto);
    }
}

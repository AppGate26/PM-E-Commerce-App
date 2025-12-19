package com.appGate.delivery.controller;

import com.appGate.delivery.dto.RiderChangePasswordDto;
import com.appGate.delivery.dto.RiderForgotPasswordDto;
import com.appGate.delivery.dto.RiderLoginDto;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.service.RiderAuthService;
import com.appGate.rbac.dto.ResetPasswordDto;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery-agent/auth")
@Tag(name = "Delivery Agent Operations", description = "Delivery agent authentication and delivery operations")
public class RiderAuthController {

    private final RiderAuthService riderAuthService;

    public RiderAuthController(RiderAuthService riderAuthService) {
        this.riderAuthService = riderAuthService;
    }

    @PostMapping("/login")
    public BaseResponse login(@Valid @RequestBody RiderLoginDto loginDto) {
        return riderAuthService.login(loginDto);
    }

    @PutMapping("/change-password/{riderId}")
    public BaseResponse changePassword(
            @PathVariable Long riderId,
            @Valid @RequestBody RiderChangePasswordDto dto) {
        return riderAuthService.changePassword(riderId, dto);
    }

    @PostMapping("/forgot-password")
    public BaseResponse forgotPassword(@Valid @RequestBody RiderForgotPasswordDto dto) {
        return riderAuthService.forgotPassword(dto);
    }

    @PostMapping("/reset-password")
    public BaseResponse resetPassword(@RequestBody ResetPasswordDto resetPasswordDto) {
        return riderAuthService.resetPassword(resetPasswordDto);
    }
}

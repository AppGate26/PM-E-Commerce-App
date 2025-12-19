package com.appGate.rbac.controller;

import com.appGate.rbac.dto.ChangePasswordDto;
import com.appGate.rbac.dto.ForgetPasswordDto;
import com.appGate.rbac.dto.ResetPasswordDto;
import com.appGate.rbac.dto.UpdateUserDto;
import com.appGate.rbac.dto.UserDto;
import com.appGate.rbac.request.LoginRequest;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.UserService;
import com.appGate.rbac.util.JwtUtils;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    public UserController(UserService userService, JwtUtils jwtUtils) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping(value = "/sign-up")
    public BaseResponse signUp(@Valid @RequestBody UserDto userDetailDto) {
        return userService.signUp(userDetailDto);
    }

    @PostMapping(value = "/sign-in")
    public BaseResponse signIn(@Valid @RequestBody LoginRequest signInRequest) {
        return userService.signIn(signInRequest);
    }

    @PostMapping(value = "/sign-out")
    public BaseResponse signOut(@RequestHeader("Authorization") String token) {
        return userService.signOut(token);
    }   

    @PostMapping(value = "/forget-password")
    public BaseResponse forgetPassword(@RequestBody ForgetPasswordDto forgetPasswordDto) {
        return userService.forgetPassword(forgetPasswordDto);
    }

    @PostMapping(value = "/reset-password")
    public BaseResponse resetPassword(@RequestBody ResetPasswordDto resetPasswordDto) {
        return userService.resetPassword(resetPasswordDto);
    }

    @PutMapping(value = "/update-profile/{userId}")
    public BaseResponse updateProfile(@PathVariable Long userId, @RequestBody UpdateUserDto userDetailDto) {
        return userService.updateProfile(userId, userDetailDto);
    }

    @GetMapping(value = "/profile")
    public BaseResponse getUserProfile(@RequestHeader("Authorization") String token) {
        // Extract token from "Bearer " prefix
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // Extract email from JWT token
        String email = jwtUtils.extractEmail(token);

        return userService.getUserProfile(email);
    }

    @PostMapping(value = "/change-password")
    public BaseResponse changePassword(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ChangePasswordDto changePasswordDto) {

        // Extract token from "Bearer " prefix
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // Extract email from JWT token
        String email = jwtUtils.extractEmail(token);

        return userService.changePassword(
            email,
            changePasswordDto.getCurrentPassword(),
            changePasswordDto.getNewPassword(),
            changePasswordDto.getConfirmPassword()
        );
    }
}

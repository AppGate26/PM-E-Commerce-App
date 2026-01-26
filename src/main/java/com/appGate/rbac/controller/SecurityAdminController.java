package com.appGate.rbac.controller;

import com.appGate.rbac.dto.*;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.SecurityAdminService;
import com.appGate.rbac.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/admin/security")
public class SecurityAdminController {

    private final SecurityAdminService securityAdminService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public SecurityAdminController(SecurityAdminService securityAdminService, JwtUtils jwtUtils, UserRepository userRepository) {
        this.securityAdminService = securityAdminService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // ==================== VIEW USERS ====================

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return securityAdminService.getAllUsers(page, size);
    }

    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUsersByRole(
            @PathVariable RoleEnum role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return securityAdminService.getUsersByRole(role, page, size);
    }

    @GetMapping("/users/status/{status}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUsersByStatus(
            @PathVariable UserStatusEnum status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return securityAdminService.getUsersByStatus(status, page, size);
    }

    @GetMapping("/users/email")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUserByEmail(@RequestParam String email) {
        return securityAdminService.getUserByEmail(email);
    }

    // ==================== CREATE/MODIFY USER ====================

    @PostMapping("/users")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse createUser(@Valid @RequestBody CreateUserDto dto) {
        return securityAdminService.createUser(dto);
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse modifyUser(@PathVariable Long userId, @RequestBody CreateUserDto dto) {
        return securityAdminService.modifyUser(userId, dto);
    }

    // ==================== ACTIVATE/DEACTIVATE USER ====================

    @PutMapping("/users/status")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse activateDeactivateUser(@Valid @RequestBody ActivateDeactivateUserDto dto) {
        return securityAdminService.activateDeactivateUser(dto);
    }

    @PostMapping("/users/warning")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse sendWarning(@RequestParam String email, @RequestParam String message) {
        return securityAdminService.sendWarning(email, message);
    }

    // ==================== CHANGE USER PASSWORD ====================

    @PutMapping("/users/change-password")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse adminChangePassword(@Valid @RequestBody AdminChangePasswordDto dto) {
        return securityAdminService.adminChangePassword(dto);
    }

    // ==================== MERGE USER ROLE ====================

    @PutMapping("/users/role")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse mergeUserRole(@Valid @RequestBody MergeUserRoleDto dto) {
        return securityAdminService.mergeUserRole(dto);
    }

    @GetMapping("/users/role-info")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUserRoleInfo(@RequestParam String email) {
        return securityAdminService.getUserRoleInfo(email);
    }

    // ==================== USER LOG TRAILS ====================

    @GetMapping("/log-trails")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUserLogTrails(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return securityAdminService.getUserLogTrails(page, size);
    }

    @GetMapping("/log-trails/user/{userId}")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUserLogTrailsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return securityAdminService.getUserLogTrailsByUserId(userId, page, size);
    }

    // ==================== ACTIVE SESSIONS / FORCE LOGOUT ====================

    @GetMapping("/sessions/active")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getActiveSessions() {
        return securityAdminService.getActiveSessions();
    }

    @PostMapping("/sessions/force-logout")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse forceLogout(@RequestBody ForceLogoutDto dto) {
        return securityAdminService.forceLogout(dto);
    }

    // ==================== DATABASE BACKUP ====================

    @PostMapping("/backup")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public BaseResponse performBackup(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody DatabaseBackupDto dto) {
        Long userId = extractUserId(token);
        return securityAdminService.performBackup(dto, userId);
    }

    @GetMapping("/backup/history")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getBackupHistory() {
        return securityAdminService.getBackupHistory();
    }

    // ==================== UTILITY ENDPOINTS ====================

    @GetMapping("/security-questions")
    public BaseResponse getSecurityQuestions() {
        return securityAdminService.getSecurityQuestions();
    }

    @GetMapping("/user-codes")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getUserCodes() {
        return securityAdminService.getUserCodes();
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getRoles() {
        return securityAdminService.getRoles();
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

package com.appGate.settings.controller;

import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.util.JwtUtils;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.settings.dto.CurrencySettingDto;
import com.appGate.settings.dto.LanguageSettingDto;
import com.appGate.settings.service.SettingsService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/settings")
@Tag(name = "Settings", description = "Settings management for language and currency")
public class SettingsController {

    private final SettingsService settingsService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public SettingsController(SettingsService settingsService, JwtUtils jwtUtils, UserRepository userRepository) {
        this.settingsService = settingsService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // ==================== LANGUAGE ENDPOINTS ====================

    @GetMapping("/languages")
    public BaseResponse getAllLanguages() {
        return settingsService.getAllLanguages();
    }

    @GetMapping("/language")
    public BaseResponse getSelectedLanguage(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return settingsService.getSelectedLanguage(userId);
    }

    @PutMapping("/language")
    public BaseResponse updateLanguage(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody LanguageSettingDto dto) {
        Long userId = extractUserId(token);
        return settingsService.updateLanguage(userId, dto);
    }

    // ==================== CURRENCY ENDPOINTS ====================

    @GetMapping("/currencies")
    public BaseResponse getAllCurrencies() {
        return settingsService.getAllCurrencies();
    }

    @GetMapping("/currency")
    public BaseResponse getSelectedCurrency(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return settingsService.getSelectedCurrency(userId);
    }

    @PutMapping("/currency")
    public BaseResponse updateCurrency(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CurrencySettingDto dto) {
        Long userId = extractUserId(token);
        return settingsService.updateCurrency(userId, dto);
    }

    // ==================== USER SETTINGS ====================

    @GetMapping
    public BaseResponse getUserSettings(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return settingsService.getUserSettings(userId);
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

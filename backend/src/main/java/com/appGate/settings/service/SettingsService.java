package com.appGate.settings.service;

import com.appGate.rbac.response.BaseResponse;
import com.appGate.settings.dto.CurrencySettingDto;
import com.appGate.settings.dto.LanguageSettingDto;
import com.appGate.settings.enums.CurrencyEnum;
import com.appGate.settings.enums.LanguageEnum;
import com.appGate.settings.models.UserSettings;
import com.appGate.settings.repository.UserSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettingsService {

    private final UserSettingsRepository userSettingsRepository;

    public SettingsService(UserSettingsRepository userSettingsRepository) {
        this.userSettingsRepository = userSettingsRepository;
    }

    public BaseResponse getAllLanguages() {
        List<Map<String, String>> languages = Arrays.stream(LanguageEnum.values())
                .map(lang -> {
                    Map<String, String> langMap = new HashMap<>();
                    langMap.put("code", lang.name());
                    langMap.put("name", formatEnumName(lang.name()));
                    return langMap;
                })
                .collect(Collectors.toList());

        return new BaseResponse(HttpStatus.OK.value(), "successful", languages);
    }

    public BaseResponse getAllCurrencies() {
        List<Map<String, String>> currencies = Arrays.stream(CurrencyEnum.values())
                .map(curr -> {
                    Map<String, String> currMap = new HashMap<>();
                    currMap.put("code", curr.name());
                    currMap.put("name", curr.getDisplayName());
                    currMap.put("symbol", curr.getSymbol());
                    return currMap;
                })
                .collect(Collectors.toList());

        return new BaseResponse(HttpStatus.OK.value(), "successful", currencies);
    }

    public BaseResponse getUserSettings(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        return new BaseResponse(HttpStatus.OK.value(), "successful", settings);
    }

    public BaseResponse updateLanguage(Long userId, LanguageSettingDto dto) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        settings.setLanguage(dto.getLanguage());
        userSettingsRepository.save(settings);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Language updated successfully");
    }

    public BaseResponse updateCurrency(Long userId, CurrencySettingDto dto) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        settings.setCurrency(dto.getCurrency());
        userSettingsRepository.save(settings);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Currency updated successfully");
    }

    public BaseResponse getSelectedLanguage(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        Map<String, String> result = new HashMap<>();
        result.put("code", settings.getLanguage().name());
        result.put("name", formatEnumName(settings.getLanguage().name()));

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getSelectedCurrency(Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));

        Map<String, String> result = new HashMap<>();
        result.put("code", settings.getCurrency().name());
        result.put("name", settings.getCurrency().getDisplayName());
        result.put("symbol", settings.getCurrency().getSymbol());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    private UserSettings createDefaultSettings(Long userId) {
        UserSettings settings = new UserSettings();
        settings.setUserId(userId);
        settings.setLanguage(LanguageEnum.ENGLISH);
        settings.setCurrency(CurrencyEnum.NGN);
        return userSettingsRepository.save(settings);
    }

    private String formatEnumName(String enumName) {
        return Arrays.stream(enumName.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }
}

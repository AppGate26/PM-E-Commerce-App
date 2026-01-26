package com.appGate.mail.controller;

import com.appGate.mail.dto.ComposeMailDto;
import com.appGate.mail.dto.MailDisplayOptionDto;
import com.appGate.mail.dto.MailSettingsDto;
import com.appGate.mail.service.InternalMailService;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/mail")
public class InternalMailController {

    private final InternalMailService internalMailService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public InternalMailController(InternalMailService internalMailService, JwtUtils jwtUtils, UserRepository userRepository) {
        this.internalMailService = internalMailService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // ==================== INBOX ====================

    @GetMapping("/inbox")
    public BaseResponse getInbox(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = extractUserId(token);
        return internalMailService.getInbox(userId, page, size);
    }

    @GetMapping("/inbox/all")
    public BaseResponse getInboxAll(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return internalMailService.getInboxAll(userId);
    }

    @GetMapping("/inbox/unread-count")
    public BaseResponse getUnreadCount(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return internalMailService.getUnreadCount(userId);
    }

    // ==================== SENT MESSAGES ====================

    @GetMapping("/sent")
    public BaseResponse getSentMessages(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = extractUserId(token);
        return internalMailService.getSentMessages(userId, page, size);
    }

    @GetMapping("/sent/all")
    public BaseResponse getSentMessagesAll(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return internalMailService.getSentMessagesAll(userId);
    }

    // ==================== VIEW SINGLE MESSAGE ====================

    @GetMapping("/{messageId}")
    public BaseResponse getMessage(
            @RequestHeader("Authorization") String token,
            @PathVariable Long messageId) {
        Long userId = extractUserId(token);
        return internalMailService.getMessage(userId, messageId);
    }

    // ==================== COMPOSE / SEND MESSAGE ====================

    @PostMapping("/compose")
    public BaseResponse sendMessage(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ComposeMailDto dto) {
        Long userId = extractUserId(token);
        return internalMailService.sendMessage(userId, dto);
    }

    // ==================== DELETE MESSAGE ====================

    @DeleteMapping("/{messageId}")
    public BaseResponse deleteMessage(
            @RequestHeader("Authorization") String token,
            @PathVariable Long messageId) {
        Long userId = extractUserId(token);
        return internalMailService.deleteMessage(userId, messageId);
    }

    // ==================== MAIL SETTINGS ====================

    @GetMapping("/settings")
    public BaseResponse getMailSettings(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return internalMailService.getMailSettings(userId);
    }

    @PutMapping("/settings")
    public BaseResponse updateMailSettings(
            @RequestHeader("Authorization") String token,
            @RequestBody MailSettingsDto dto) {
        Long userId = extractUserId(token);
        return internalMailService.updateMailSettings(userId, dto);
    }

    @GetMapping("/display-options")
    public BaseResponse getMailDisplayOptions() {
        return internalMailService.getMailDisplayOptions();
    }

    @PutMapping("/display-option")
    public BaseResponse updateMailDisplayOption(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody MailDisplayOptionDto dto) {
        Long userId = extractUserId(token);
        return internalMailService.updateMailDisplayOption(userId, dto);
    }

    // ==================== GET USERS FOR COMPOSE ====================

    @GetMapping("/users")
    public BaseResponse getUsersForCompose() {
        return internalMailService.getUsersForCompose();
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

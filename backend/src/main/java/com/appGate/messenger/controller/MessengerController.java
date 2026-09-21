package com.appGate.messenger.controller;

import com.appGate.messenger.dto.SendMessageDto;
import com.appGate.messenger.service.MessengerService;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.util.JwtUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/messenger")
@Tag(name = "Mail & Messenger", description = "Real-time messaging between users")
public class MessengerController {

    private final MessengerService messengerService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public MessengerController(MessengerService messengerService, JwtUtils jwtUtils, UserRepository userRepository) {
        this.messengerService = messengerService;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    // ==================== ONLINE USERS ====================

    @GetMapping("/users/online")
    public BaseResponse getOnlineUsers() {
        return messengerService.getOnlineUsers();
    }

    @GetMapping("/users/all")
    public BaseResponse getAllUsersWithStatus() {
        return messengerService.getAllUsersWithStatus();
    }

    @PostMapping("/status/online")
    public BaseResponse setOnline(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return messengerService.updateOnlineStatus(userId, true);
    }

    @PostMapping("/status/offline")
    public BaseResponse setOffline(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return messengerService.updateOnlineStatus(userId, false);
    }

    // ==================== CONVERSATIONS ====================

    @GetMapping("/conversations")
    public BaseResponse getConversations(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return messengerService.getConversations(userId);
    }

    @GetMapping("/conversations/user/{otherUserId}")
    public BaseResponse getOrCreateConversation(
            @RequestHeader("Authorization") String token,
            @PathVariable Long otherUserId) {
        Long userId = extractUserId(token);
        return messengerService.getOrCreateConversation(userId, otherUserId);
    }

    // ==================== MESSAGES ====================

    @GetMapping("/messages/{conversationId}")
    public BaseResponse getMessages(
            @RequestHeader("Authorization") String token,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = extractUserId(token);
        return messengerService.getMessages(userId, conversationId, page, size);
    }

    @GetMapping("/messages/user/{otherUserId}")
    public BaseResponse getMessagesByUserId(
            @RequestHeader("Authorization") String token,
            @PathVariable Long otherUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = extractUserId(token);
        return messengerService.getMessagesByUserId(userId, otherUserId, page, size);
    }

    @PostMapping("/messages/{conversationId}/read")
    public BaseResponse markAsRead(
            @RequestHeader("Authorization") String token,
            @PathVariable Long conversationId) {
        Long userId = extractUserId(token);
        return messengerService.markAsRead(userId, conversationId);
    }

    // ==================== SEND MESSAGE ====================

    @PostMapping("/send")
    public BaseResponse sendMessage(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody SendMessageDto dto) {
        Long userId = extractUserId(token);
        return messengerService.sendMessage(userId, dto);
    }

    // ==================== UNREAD COUNT ====================

    @GetMapping("/unread-count")
    public BaseResponse getTotalUnreadCount(@RequestHeader("Authorization") String token) {
        Long userId = extractUserId(token);
        return messengerService.getTotalUnreadCount(userId);
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

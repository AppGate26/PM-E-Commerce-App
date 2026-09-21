package com.appGate.messenger.service;

import com.appGate.messenger.dto.SendMessageDto;
import com.appGate.messenger.models.MessengerConversation;
import com.appGate.messenger.models.MessengerMessage;
import com.appGate.messenger.models.UserOnlineStatus;
import com.appGate.messenger.repository.MessengerConversationRepository;
import com.appGate.messenger.repository.MessengerMessageRepository;
import com.appGate.messenger.repository.UserOnlineStatusRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessengerService {

    private final MessengerConversationRepository conversationRepository;
    private final MessengerMessageRepository messageRepository;
    private final UserOnlineStatusRepository onlineStatusRepository;
    private final UserRepository userRepository;

    public MessengerService(MessengerConversationRepository conversationRepository,
                           MessengerMessageRepository messageRepository,
                           UserOnlineStatusRepository onlineStatusRepository,
                           UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.onlineStatusRepository = onlineStatusRepository;
        this.userRepository = userRepository;
    }

    // ==================== ONLINE USERS ====================

    public BaseResponse getOnlineUsers() {
        List<UserOnlineStatus> onlineStatuses = onlineStatusRepository.findByIsOnlineTrue();

        List<Long> onlineUserIds = onlineStatuses.stream()
                .map(UserOnlineStatus::getUserId)
                .collect(Collectors.toList());

        List<User> onlineUsers = userRepository.findAllById(onlineUserIds);

        List<Map<String, Object>> result = onlineUsers.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("email", user.getEmail());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());
                    userMap.put("isOnline", true);
                    return userMap;
                })
                .collect(Collectors.toList());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getAllUsersWithStatus() {
        List<User> allUsers = userRepository.findAll();

        List<Map<String, Object>> result = allUsers.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("email", user.getEmail());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());

                    Optional<UserOnlineStatus> status = onlineStatusRepository.findByUserId(user.getId());
                    userMap.put("isOnline", status.map(UserOnlineStatus::getIsOnline).orElse(false));
                    userMap.put("lastSeen", status.map(UserOnlineStatus::getLastSeen).orElse(null));

                    return userMap;
                })
                .collect(Collectors.toList());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse updateOnlineStatus(Long userId, boolean isOnline) {
        UserOnlineStatus status = onlineStatusRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserOnlineStatus newStatus = new UserOnlineStatus();
                    newStatus.setUserId(userId);
                    return newStatus;
                });

        status.setIsOnline(isOnline);
        status.setLastSeen(LocalDateTime.now());
        onlineStatusRepository.save(status);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Status updated");
    }

    // ==================== CONVERSATIONS ====================

    public BaseResponse getConversations(Long userId) {
        List<MessengerConversation> conversations = conversationRepository.findConversationsByUserId(userId);

        List<Map<String, Object>> result = conversations.stream()
                .map(conv -> {
                    Map<String, Object> convMap = new HashMap<>();
                    convMap.put("id", conv.getId());
                    convMap.put("lastMessage", conv.getLastMessage());
                    convMap.put("lastMessageAt", conv.getLastMessageAt());

                    // Determine the other user in the conversation
                    User otherUser = conv.getUserOne().getId().equals(userId) ? conv.getUserTwo() : conv.getUserOne();
                    Map<String, Object> otherUserMap = new HashMap<>();
                    otherUserMap.put("id", otherUser.getId());
                    otherUserMap.put("email", otherUser.getEmail());
                    otherUserMap.put("firstName", otherUser.getFirstName());
                    otherUserMap.put("lastName", otherUser.getLastName());

                    // Check online status
                    Optional<UserOnlineStatus> onlineStatus = onlineStatusRepository.findByUserId(otherUser.getId());
                    otherUserMap.put("isOnline", onlineStatus.map(UserOnlineStatus::getIsOnline).orElse(false));

                    convMap.put("otherUser", otherUserMap);

                    // Unread count for current user
                    int unreadCount = conv.getUserOne().getId().equals(userId)
                            ? conv.getUserOneUnreadCount()
                            : conv.getUserTwoUnreadCount();
                    convMap.put("unreadCount", unreadCount);

                    return convMap;
                })
                .collect(Collectors.toList());

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getOrCreateConversation(Long currentUserId, Long otherUserId) {
        Optional<MessengerConversation> existingConv = conversationRepository
                .findConversationBetweenUsers(currentUserId, otherUserId);

        if (existingConv.isPresent()) {
            return new BaseResponse(HttpStatus.OK.value(), "successful", existingConv.get());
        }

        // Create new conversation
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Other user not found"));

        MessengerConversation conversation = new MessengerConversation();
        conversation.setUserOne(currentUser);
        conversation.setUserTwo(otherUser);
        conversation.setLastMessageAt(LocalDateTime.now());

        conversationRepository.save(conversation);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", conversation);
    }

    // ==================== MESSAGES ====================

    public BaseResponse getMessages(Long userId, Long conversationId, int page, int size) {
        // Verify user is part of the conversation
        MessengerConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conversation.getUserOne().getId().equals(userId) && !conversation.getUserTwo().getId().equals(userId)) {
            return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure", "Access denied");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<MessengerMessage> messages = messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageable);

        return new BaseResponse(HttpStatus.OK.value(), "successful", messages);
    }

    public BaseResponse getMessagesByUserId(Long currentUserId, Long otherUserId, int page, int size) {
        // Find or create conversation
        Optional<MessengerConversation> convOpt = conversationRepository
                .findConversationBetweenUsers(currentUserId, otherUserId);

        if (convOpt.isEmpty()) {
            return new BaseResponse(HttpStatus.OK.value(), "successful", List.of());
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<MessengerMessage> messages = messageRepository
                .findByConversationIdOrderBySentAtDesc(convOpt.get().getId(), pageable);

        return new BaseResponse(HttpStatus.OK.value(), "successful", messages);
    }

    @Transactional
    public BaseResponse markAsRead(Long userId, Long conversationId) {
        MessengerConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        // Mark messages as read
        messageRepository.markMessagesAsRead(conversationId, userId);

        // Reset unread count
        if (conversation.getUserOne().getId().equals(userId)) {
            conversation.setUserOneUnreadCount(0);
        } else {
            conversation.setUserTwoUnreadCount(0);
        }
        conversationRepository.save(conversation);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Messages marked as read");
    }

    // ==================== SEND MESSAGE ====================

    @Transactional
    public BaseResponse sendMessage(Long senderId, SendMessageDto dto) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        User recipient = userRepository.findById(dto.getRecipientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        // Get or create conversation
        MessengerConversation conversation = conversationRepository
                .findConversationBetweenUsers(senderId, dto.getRecipientId())
                .orElseGet(() -> {
                    MessengerConversation newConv = new MessengerConversation();
                    newConv.setUserOne(sender);
                    newConv.setUserTwo(recipient);
                    return conversationRepository.save(newConv);
                });

        // Create message
        MessengerMessage message = new MessengerMessage();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setMessage(dto.getMessage());
        message.setAttachmentUrl(dto.getAttachmentUrl());
        message.setSentAt(LocalDateTime.now());
        message.setIsRead(false);

        messageRepository.save(message);

        // Update conversation
        conversation.setLastMessage(dto.getMessage().length() > 50
                ? dto.getMessage().substring(0, 50) + "..."
                : dto.getMessage());
        conversation.setLastMessageAt(LocalDateTime.now());

        // Increment unread count for recipient
        if (conversation.getUserOne().getId().equals(dto.getRecipientId())) {
            conversation.setUserOneUnreadCount(conversation.getUserOneUnreadCount() + 1);
        } else {
            conversation.setUserTwoUnreadCount(conversation.getUserTwoUnreadCount() + 1);
        }

        conversationRepository.save(conversation);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", message);
    }

    // ==================== UNREAD COUNT ====================

    public BaseResponse getTotalUnreadCount(Long userId) {
        Long count = messageRepository.countByRecipientIdAndIsReadFalse(userId);

        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }
}

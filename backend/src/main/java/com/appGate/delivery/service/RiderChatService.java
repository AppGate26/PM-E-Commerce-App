package com.appGate.delivery.service;

import com.appGate.delivery.response.BaseResponse;
import com.appGate.messenger.dto.SendMessageDto;
import com.appGate.messenger.models.MessengerConversation;
import com.appGate.messenger.models.MessengerMessage;
import com.appGate.messenger.models.UserOnlineStatus;
import com.appGate.messenger.repository.MessengerConversationRepository;
import com.appGate.messenger.repository.MessengerMessageRepository;
import com.appGate.messenger.repository.UserOnlineStatusRepository;
import com.appGate.messenger.service.MessengerService;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.enums.UserStatusEnum;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.service.BranchScopeService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Rider <-> admin/dispatch chat for the delivery app. Sits on top of the existing messenger
 * (the same conversations the web Mail & Messenger page shows), so dispatch replies from
 * there. The rider is identified by their login token: every rider has a matching User row
 * (role RIDER, same email - see RiderService.saveRider), which is who the messages are from.
 *
 * <p>A rider may only talk to dispatch staff - admins, plus branch managers of the rider's
 * own branch - or to anyone who has already messaged them.
 */
@Service
public class RiderChatService {

    private static final Set<RoleEnum> ADMIN_ROLES = Set.of(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN);
    private static final int MESSAGE_PAGE_SIZE = 100;

    private final BranchScopeService branchScopeService;
    private final UserRepository userRepository;
    private final MessengerService messengerService;
    private final MessengerConversationRepository conversationRepository;
    private final MessengerMessageRepository messageRepository;
    private final UserOnlineStatusRepository onlineStatusRepository;

    public RiderChatService(BranchScopeService branchScopeService,
                            UserRepository userRepository,
                            MessengerService messengerService,
                            MessengerConversationRepository conversationRepository,
                            MessengerMessageRepository messageRepository,
                            UserOnlineStatusRepository onlineStatusRepository) {
        this.branchScopeService = branchScopeService;
        this.userRepository = userRepository;
        this.messengerService = messengerService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.onlineStatusRepository = onlineStatusRepository;
    }

    public BaseResponse getContacts() {
        User me = currentUser();

        // Existing conversations first, so a staff member who isn't a dispatch role but has
        // already messaged the rider still shows up.
        Map<Long, Map<String, Object>> contacts = new LinkedHashMap<>();
        for (MessengerConversation conv : conversationRepository.findConversationsByUserId(me.getId())) {
            boolean iAmUserOne = conv.getUserOne().getId().equals(me.getId());
            User other = iAmUserOne ? conv.getUserTwo() : conv.getUserOne();
            Map<String, Object> contact = toContact(other);
            contact.put("conversationId", conv.getId());
            contact.put("lastMessage", conv.getLastMessage());
            contact.put("lastMessageAt", conv.getLastMessageAt());
            contact.put("unreadCount", iAmUserOne ? conv.getUserOneUnreadCount() : conv.getUserTwoUnreadCount());
            contacts.put(other.getId(), contact);
        }

        for (User user : dispatchStaffFor(me)) {
            contacts.computeIfAbsent(user.getId(), id -> {
                Map<String, Object> contact = toContact(user);
                contact.put("unreadCount", 0);
                return contact;
            });
        }

        List<Map<String, Object>> result = new ArrayList<>(contacts.values());
        result.sort(Comparator
                .comparing((Map<String, Object> c) -> (LocalDateTime) c.get("lastMessageAt"),
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(c -> String.valueOf(c.get("name")), String.CASE_INSENSITIVE_ORDER));

        return new BaseResponse(HttpStatus.OK.value(), "Chat contacts retrieved successfully", result);
    }

    /** The conversation with one contact, oldest first. Opening it marks it read. */
    public BaseResponse getMessages(Long contactUserId) {
        User me = currentUser();

        List<Map<String, Object>> result = new ArrayList<>();
        conversationRepository.findConversationBetweenUsers(me.getId(), contactUserId).ifPresent(conv -> {
            List<MessengerMessage> messages = new ArrayList<>(messageRepository
                    .findByConversationIdOrderBySentAtDesc(conv.getId(), PageRequest.of(0, MESSAGE_PAGE_SIZE))
                    .getContent());
            Collections.reverse(messages);
            messages.forEach(m -> result.add(toMessage(m, me.getId())));
            messengerService.markAsRead(me.getId(), conv.getId());
        });

        return new BaseResponse(HttpStatus.OK.value(), "Messages retrieved successfully", result);
    }

    public BaseResponse sendMessage(Long contactUserId, String text) {
        User me = currentUser();
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty");
        }
        User recipient = userRepository.findById(contactUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
        boolean existingConversation = conversationRepository
                .findConversationBetweenUsers(me.getId(), contactUserId).isPresent();
        if (!existingConversation && !isDispatchStaffFor(me, recipient)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only message dispatch staff");
        }

        SendMessageDto dto = new SendMessageDto();
        dto.setRecipientId(contactUserId);
        dto.setMessage(text.trim());
        messengerService.sendMessage(me.getId(), dto);

        // Hand back the updated thread so the app can redraw in one round trip.
        return getMessages(contactUserId);
    }

    public BaseResponse getUnreadCount() {
        User me = currentUser();
        Long count = messageRepository.countByRecipientIdAndIsReadFalse(me.getId());
        return new BaseResponse(HttpStatus.OK.value(), "Unread count retrieved successfully",
                Map.of("unreadCount", count != null ? count : 0L));
    }

    private User currentUser() {
        return branchScopeService.getCurrentUser()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "No account is linked to this login - ask an admin to re-save your rider profile"));
    }

    private List<User> dispatchStaffFor(User rider) {
        List<User> staff = new ArrayList<>();
        for (RoleEnum role : List.of(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.BRANCH_MANAGER)) {
            for (User user : userRepository.findByRole(role)) {
                if (isDispatchStaffFor(rider, user)) {
                    staff.add(user);
                }
            }
        }
        return staff;
    }

    private boolean isDispatchStaffFor(User rider, User candidate) {
        if (candidate.getId().equals(rider.getId()) || candidate.getStatus() != UserStatusEnum.ACTIVE) {
            return false;
        }
        if (ADMIN_ROLES.contains(candidate.getRole())) {
            return true;
        }
        if (candidate.getRole() == RoleEnum.BRANCH_MANAGER) {
            Long riderBranch = rider.getBranch() != null ? rider.getBranch().getId() : null;
            Long candidateBranch = candidate.getBranch() != null ? candidate.getBranch().getId() : null;
            return riderBranch == null || Objects.equals(riderBranch, candidateBranch);
        }
        return false;
    }

    private Map<String, Object> toContact(User user) {
        Map<String, Object> contact = new HashMap<>();
        contact.put("userId", user.getId());
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        contact.put("name", name.isEmpty() ? user.getEmail() : name);
        contact.put("role", user.getRole() != null ? user.getRole().name() : null);
        contact.put("isOnline", onlineStatusRepository.findByUserId(user.getId())
                .map(UserOnlineStatus::getIsOnline).orElse(false));
        return contact;
    }

    private Map<String, Object> toMessage(MessengerMessage message, Long myUserId) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", message.getId());
        m.put("message", message.getMessage());
        m.put("sentAt", message.getSentAt());
        m.put("isRead", message.getIsRead());
        m.put("fromMe", message.getSender() != null && myUserId.equals(message.getSender().getId()));
        return m;
    }
}

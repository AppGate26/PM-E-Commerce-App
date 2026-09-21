package com.appGate.customercare.service;

import com.appGate.customercare.dto.*;
import com.appGate.customercare.enums.*;
import com.appGate.customercare.models.*;
import com.appGate.customercare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerCareService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CallLogRepository callLogRepository;
    private final EmailTicketRepository emailTicketRepository;
    private final SocialMediaRepository socialMediaRepository;
    private final EscalationRepository escalationRepository;
    private final com.appGate.email.services.EmailService emailService;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    // ==================== LIVE CHAT ====================

    public List<ChatConversation> getChatList() {
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? chatConversationRepository.findByStatus(ChatStatus.ACTIVE)
                : chatConversationRepository.findByStatusAndBranchId(ChatStatus.ACTIVE, branchId);
    }

    // Create a new chat conversation so the UI has a chatId to send/read messages against.
    // Optionally seeds the conversation with a first message.
    @Transactional
    public ChatConversation createChat(CreateChatDto dto) {
        ChatConversation conversation = new ChatConversation();
        conversation.setUserId(dto.getUserId());
        conversation.setUserName(dto.getUserName() != null && !dto.getUserName().isBlank()
                ? dto.getUserName() : "Guest");
        conversation.setStatus(ChatStatus.ACTIVE);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setUnreadCount(0);
        ChatConversation saved = chatConversationRepository.save(conversation);

        if (dto.getMessage() != null && !dto.getMessage().isBlank()) {
            MessageSender sender = "SUPPORT".equalsIgnoreCase(dto.getSender())
                    ? MessageSender.SUPPORT : MessageSender.CUSTOMER;
            ChatMessage message = new ChatMessage();
            message.setChatConversation(saved);
            message.setSender(sender);
            message.setMessage(dto.getMessage());
            message.setSentAt(LocalDateTime.now());
            chatMessageRepository.save(message);
            if (sender == MessageSender.CUSTOMER) {
                saved.setUnreadCount(1);
            }
            saved.setLastMessageAt(LocalDateTime.now());
            saved = chatConversationRepository.save(saved);
        }
        return saved;
    }

    public List<ChatMessage> getChatMessages(Long chatId) {
        conversationInScope(chatId);
        return chatMessageRepository.findByChatConversationIdOrderBySentAtAsc(chatId);
    }

    /** Load a conversation, refusing one that belongs to another branch. */
    private ChatConversation conversationInScope(Long chatId) {
        ChatConversation conversation = chatConversationRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat conversation not found"));
        branchScopeService.assertCanAccess(conversation.getBranchId());
        return conversation;
    }

    @Transactional
    public ChatMessage sendChatMessage(Long chatId, ChatMessageDto dto) {
        ChatConversation conversation = conversationInScope(chatId);

        ChatMessage message = new ChatMessage();
        message.setChatConversation(conversation);
        message.setSender(MessageSender.SUPPORT);
        message.setMessage(dto.getMessage());
        message.setAttachmentUrl(dto.getAttachmentUrl());
        message.setSentAt(LocalDateTime.now());

        // Update conversation
        conversation.setLastMessageAt(LocalDateTime.now());
        chatConversationRepository.save(conversation);

        return chatMessageRepository.save(message);
    }

    // ==================== LIVE CHAT (customer self-service) ====================
    // These endpoints resolve "which conversation" from the caller's own authenticated
    // identity instead of a client-supplied id, so each signed-in customer is always
    // routed to their own thread and can never land in another customer's chat.

    /** The signed-in caller, or a rejection for anyone hitting the self-service chat unauthenticated. */
    private com.appGate.rbac.models.User currentChatUser() {
        return branchScopeService.getCurrentUser()
                .orElseThrow(() -> new RuntimeException("You must be signed in to use live chat"));
    }

    /** Get-or-create the signed-in customer's own active conversation. */
    @Transactional
    public ChatConversation getOrCreateMyChat() {
        com.appGate.rbac.models.User user = currentChatUser();
        return chatConversationRepository
                .findFirstByUserIdAndStatusOrderByLastMessageAtDesc(user.getId(), ChatStatus.ACTIVE)
                .orElseGet(() -> {
                    ChatConversation conversation = new ChatConversation();
                    conversation.setUserId(user.getId());
                    conversation.setUserName(customerDisplayName(user));
                    conversation.setStatus(ChatStatus.ACTIVE);
                    conversation.setLastMessageAt(LocalDateTime.now());
                    conversation.setUnreadCount(0);
                    return chatConversationRepository.save(conversation);
                });
    }

    public List<ChatMessage> getMyChatMessages() {
        ChatConversation conversation = getOrCreateMyChat();
        return chatMessageRepository.findByChatConversationIdOrderBySentAtAsc(conversation.getId());
    }

    @Transactional
    public ChatMessage sendMyChatMessage(ChatMessageDto dto) {
        ChatConversation conversation = getOrCreateMyChat();

        ChatMessage message = new ChatMessage();
        message.setChatConversation(conversation);
        message.setSender(MessageSender.CUSTOMER);
        message.setMessage(dto.getMessage());
        message.setAttachmentUrl(dto.getAttachmentUrl());
        message.setSentAt(LocalDateTime.now());

        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setUnreadCount((conversation.getUnreadCount() == null ? 0 : conversation.getUnreadCount()) + 1);
        chatConversationRepository.save(conversation);

        return chatMessageRepository.save(message);
    }

    private String customerDisplayName(com.appGate.rbac.models.User user) {
        String name = java.util.stream.Stream.of(user.getFirstName(), user.getLastName())
                .filter(part -> part != null && !part.isBlank())
                .collect(java.util.stream.Collectors.joining(" "));
        return name.isBlank() ? user.getEmail() : name;
    }

    public Map<String, Object> getChatCount() {
        Long branchId = branchScopeService.getScopedBranchId();
        Long count = branchId == null
                ? chatConversationRepository.countByStatus(ChatStatus.ACTIVE)
                : chatConversationRepository.countByStatusAndBranchId(ChatStatus.ACTIVE, branchId);
        Map<String, Object> result = new HashMap<>();
        result.put("activeChats", count);
        return result;
    }

    // ==================== EMAIL SUPPORT ====================

    public Page<EmailTicket> getEmailTickets(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? emailTicketRepository.findAll(pageable)
                : emailTicketRepository.findByBranchId(branchId, pageable);
    }

    public EmailTicket getEmailTicketDetails(Long ticketId) {
        return ticketInScope(ticketId);
    }

    /** Load a ticket, refusing one that belongs to another branch. */
    private EmailTicket ticketInScope(Long ticketId) {
        EmailTicket ticket = emailTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Email ticket not found"));
        branchScopeService.assertCanAccess(ticket.getBranchId());
        return ticket;
    }

    @Transactional
    public EmailTicket replyToEmailTicket(Long ticketId, EmailReplyDto dto) {
        EmailTicket ticket = ticketInScope(ticketId);

        ticket.setReply(dto.getMessage());
        ticket.setStatus(TicketStatus.RESOLVED);

        return emailTicketRepository.save(ticket);
    }

    // ==================== PHONE SUPPORT ====================

    public List<CallLog> getIncomingCalls() {
        return callsWithStatus(CallStatus.RINGING);
    }

    /** Calls with a given status, restricted to the caller's branch. */
    private List<CallLog> callsWithStatus(CallStatus status) {
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? callLogRepository.findByStatus(status)
                : callLogRepository.findByStatusAndBranchId(status, branchId);
    }

    /** Load a call, refusing one that belongs to another branch. */
    private CallLog callInScope(Long callId) {
        CallLog call = callLogRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));
        branchScopeService.assertCanAccess(call.getBranchId());
        return call;
    }

    @Transactional
    public CallLog acceptCall(Long callId) {
        CallLog call = callInScope(callId);

        call.setStatus(CallStatus.CONNECTED);
        return callLogRepository.save(call);
    }

    @Transactional
    public CallLog declineCall(Long callId) {
        CallLog call = callInScope(callId);

        call.setStatus(CallStatus.REJECTED);
        return callLogRepository.save(call);
    }

    @Transactional
    public CallLog endCall(Long callId, EndCallDto dto) {
        CallLog call = callInScope(callId);

        call.setStatus(CallStatus.ENDED);
        call.setComplain(dto.getComplain());
        call.setComment(dto.getComment());
        return callLogRepository.save(call);
    }

    public List<CallLog> getCallQueue() {
        return callsWithStatus(CallStatus.RINGING);
    }

    public List<CallLog> getIgnoredCalls() {
        return unansweredCalls();
    }

    /** Missed and rejected calls, restricted to the caller's branch. */
    private List<CallLog> unansweredCalls() {
        List<CallStatus> statuses = List.of(CallStatus.MISSED, CallStatus.REJECTED);
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? callLogRepository.findByStatusIn(statuses)
                : callLogRepository.findByStatusInAndBranchId(statuses, branchId);
    }

    // ==================== CALL LOG ====================

    public Page<CallLog> getAllCalls(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long branchId = branchScopeService.getScopedBranchId();

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            return pagedCallsWithStatus(CallStatus.valueOf(status.toUpperCase()), page, size);
        }
        return branchId == null
                ? callLogRepository.findAll(pageable)
                : callLogRepository.findByBranchId(branchId, pageable);
    }

    /** A page of calls with a given status, restricted to the caller's branch. */
    private Page<CallLog> pagedCallsWithStatus(CallStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? callLogRepository.findByStatus(status, pageable)
                : callLogRepository.findByStatusAndBranchId(status, branchId, pageable);
    }

    public Page<CallLog> getReceivedCalls(int page, int size) {
        return pagedCallsWithStatus(CallStatus.RECEIVED, page, size);
    }

    public Page<CallLog> getRejectedCalls(int page, int size) {
        return pagedCallsWithStatus(CallStatus.REJECTED, page, size);
    }

    public Page<CallLog> getMissedCalls(int page, int size) {
        return pagedCallsWithStatus(CallStatus.MISSED, page, size);
    }

    // ==================== REPORTS ====================

    public Map<String, Object> getReceivedCallsReport() {
        List<CallLog> calls = callsWithStatus(CallStatus.RECEIVED);

        Map<String, Object> report = new HashMap<>();
        report.put("companyName", "PEACE OF MIND ELECTRONICS");
        report.put("address", "64 OGUI ROAD, ENUGU-STATE");
        report.put("tel", "080XXXXXX");
        report.put("reportTitle", "ALL RECEIVED CALLS REPORT");
        report.put("calls", calls);

        return report;
    }

    public Map<String, Object> getUnansweredCallsReport() {
        List<CallLog> calls = unansweredCalls();

        Map<String, Object> report = new HashMap<>();
        report.put("companyName", "PEACE OF MIND ELECTRONICS");
        report.put("address", "64 OGUI ROAD, ENUGU-STATE");
        report.put("tel", "080XXXXXX");
        report.put("reportTitle", "ALL UNANSWERED CALLS REPORT");
        report.put("calls", calls);

        return report;
    }

    // ==================== SOCIAL MEDIA ====================

    /**
     * Social handles follow the shared-reference-data rule: a link with no branch
     * is the company's own and everyone sees it; a branch may add its own on top.
     */
    public List<SocialMedia> getSocialMediaLinks() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<SocialMedia> links = socialMediaRepository.findAll();
        if (branchId == null) {
            return links;
        }
        return links.stream()
                .filter(l -> l.getBranchId() == null || branchId.equals(l.getBranchId()))
                .collect(java.util.stream.Collectors.toList());
    }

    public SocialMedia createSocialMedia(SocialMediaDto dto) {
        SocialMedia link = new SocialMedia();
        link.setPlatform(dto.getPlatform());
        link.setUrl(dto.getUrl());
        link.setIcon(dto.getIcon());
        link.setHandle(dto.getHandle());
        return socialMediaRepository.save(link);
    }

    public SocialMedia updateSocialMedia(Long id, SocialMediaDto dto) {
        SocialMedia link = socialMediaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Social media link not found"));
        branchScopeService.assertCanAccessShared(link.getBranchId());
        if (dto.getPlatform() != null) link.setPlatform(dto.getPlatform());
        if (dto.getUrl() != null) link.setUrl(dto.getUrl());
        if (dto.getIcon() != null) link.setIcon(dto.getIcon());
        if (dto.getHandle() != null) link.setHandle(dto.getHandle());
        return socialMediaRepository.save(link);
    }

    public void deleteSocialMedia(Long id) {
        socialMediaRepository.findById(id)
                .ifPresent(link -> {
                    branchScopeService.assertCanAccessShared(link.getBranchId());
                    socialMediaRepository.delete(link);
                });
    }

    // ==================== ESCALATIONS ====================

    @Transactional
    public Escalation createEscalation(CreateEscalationDto dto) {
        Escalation escalation = new Escalation();
        escalation.setTarget(dto.getTarget());
        escalation.setDepartment(dto.getDepartment());
        escalation.setEmail(dto.getEmail());
        escalation.setPriority(dto.getPriority());
        escalation.setSubject(dto.getSubject());
        escalation.setDetails(dto.getDetails());
        escalation.setRaisedBy(dto.getRaisedBy());
        escalation.setStatus(EscalationStatus.OPEN);

        Escalation saved = escalationRepository.save(escalation);

        // For EMAIL escalations, also dispatch a real email. Never let a mail failure roll back
        // the saved escalation record.
        if (dto.getTarget() == EscalationTarget.EMAIL && dto.getEmail() != null && !dto.getEmail().isBlank()) {
            try {
                com.appGate.email.dto.EmailDto emailDto = new com.appGate.email.dto.EmailDto();
                emailDto.setRecipient(dto.getEmail());
                emailDto.setSubject("[Escalation" + (dto.getPriority() != null ? " - " + dto.getPriority() : "")
                        + "] " + (dto.getSubject() != null ? dto.getSubject() : "Customer care escalation"));
                emailDto.setContent(buildEscalationEmailBody(dto));
                emailService.sendEmail(emailDto);
                log.info("Escalation email sent to {}", dto.getEmail());
            } catch (Exception e) {
                log.error("Failed to send escalation email to {}: {}", dto.getEmail(), e.getMessage(), e);
            }
        }

        return saved;
    }

    private String buildEscalationEmailBody(CreateEscalationDto dto) {
        return "<p><strong>Priority:</strong> " + (dto.getPriority() != null ? dto.getPriority() : "Normal") + "</p>"
                + "<p><strong>Raised by:</strong> " + (dto.getRaisedBy() != null ? dto.getRaisedBy() : "Customer Care") + "</p>"
                + "<p><strong>Subject:</strong> " + (dto.getSubject() != null ? dto.getSubject() : "") + "</p>"
                + "<p>" + (dto.getDetails() != null ? dto.getDetails() : "") + "</p>";
    }

    public List<Escalation> getEscalations(String department, EscalationStatus status) {
        Long branchId = branchScopeService.getScopedBranchId();
        boolean byDepartment = department != null && !department.isBlank();

        if (branchId == null) {
            if (byDepartment && status != null) {
                return escalationRepository.findByDepartmentAndStatusOrderByCreatedAtDesc(department, status);
            }
            if (byDepartment) {
                return escalationRepository.findByDepartmentOrderByCreatedAtDesc(department);
            }
            if (status != null) {
                return escalationRepository.findByStatusOrderByCreatedAtDesc(status);
            }
            return escalationRepository.findAllByOrderByCreatedAtDesc();
        }

        if (byDepartment && status != null) {
            return escalationRepository.findByDepartmentAndStatusAndBranchIdOrderByCreatedAtDesc(
                    department, status, branchId);
        }
        if (byDepartment) {
            return escalationRepository.findByDepartmentAndBranchIdOrderByCreatedAtDesc(department, branchId);
        }
        if (status != null) {
            return escalationRepository.findByStatusAndBranchIdOrderByCreatedAtDesc(status, branchId);
        }
        return escalationRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
    }

    @Transactional
    public Escalation resolveEscalation(Long id) {
        Escalation escalation = escalationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Escalation not found"));
        branchScopeService.assertCanAccess(escalation.getBranchId());
        escalation.setStatus(EscalationStatus.RESOLVED);
        return escalationRepository.save(escalation);
    }
}

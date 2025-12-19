package com.appGate.customercare.service;

import com.appGate.customercare.dto.*;
import com.appGate.customercare.enums.*;
import com.appGate.customercare.models.*;
import com.appGate.customercare.repository.*;
import lombok.RequiredArgsConstructor;
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
public class CustomerCareService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CallLogRepository callLogRepository;
    private final EmailTicketRepository emailTicketRepository;
    private final SocialMediaRepository socialMediaRepository;

    // ==================== LIVE CHAT ====================

    public List<ChatConversation> getChatList() {
        return chatConversationRepository.findByStatus(ChatStatus.ACTIVE);
    }

    public List<ChatMessage> getChatMessages(Long chatId) {
        return chatMessageRepository.findByChatConversationIdOrderBySentAtAsc(chatId);
    }

    @Transactional
    public ChatMessage sendChatMessage(Long chatId, ChatMessageDto dto) {
        ChatConversation conversation = chatConversationRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat conversation not found"));

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

    public Map<String, Object> getChatCount() {
        Long count = chatConversationRepository.countByStatus(ChatStatus.ACTIVE);
        Map<String, Object> result = new HashMap<>();
        result.put("activeChats", count);
        return result;
    }

    // ==================== EMAIL SUPPORT ====================

    public Page<EmailTicket> getEmailTickets(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return emailTicketRepository.findAll(pageable);
    }

    public EmailTicket getEmailTicketDetails(Long ticketId) {
        return emailTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Email ticket not found"));
    }

    @Transactional
    public EmailTicket replyToEmailTicket(Long ticketId, EmailReplyDto dto) {
        EmailTicket ticket = emailTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Email ticket not found"));

        ticket.setReply(dto.getMessage());
        ticket.setStatus(TicketStatus.RESOLVED);

        return emailTicketRepository.save(ticket);
    }

    // ==================== PHONE SUPPORT ====================

    public List<CallLog> getIncomingCalls() {
        return callLogRepository.findByStatus(CallStatus.RINGING);
    }

    @Transactional
    public CallLog acceptCall(Long callId) {
        CallLog call = callLogRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));

        call.setStatus(CallStatus.CONNECTED);
        return callLogRepository.save(call);
    }

    @Transactional
    public CallLog declineCall(Long callId) {
        CallLog call = callLogRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));

        call.setStatus(CallStatus.REJECTED);
        return callLogRepository.save(call);
    }

    @Transactional
    public CallLog endCall(Long callId, EndCallDto dto) {
        CallLog call = callLogRepository.findById(callId)
                .orElseThrow(() -> new RuntimeException("Call not found"));

        call.setStatus(CallStatus.ENDED);
        call.setComplain(dto.getComplain());
        call.setComment(dto.getComment());
        return callLogRepository.save(call);
    }

    public List<CallLog> getCallQueue() {
        return callLogRepository.findByStatus(CallStatus.RINGING);
    }

    public List<CallLog> getIgnoredCalls() {
        return callLogRepository.findByStatusIn(List.of(CallStatus.MISSED, CallStatus.REJECTED));
    }

    // ==================== CALL LOG ====================

    public Page<CallLog> getAllCalls(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (status != null && !status.equalsIgnoreCase("ALL")) {
            CallStatus callStatus = CallStatus.valueOf(status.toUpperCase());
            return callLogRepository.findByStatus(callStatus, pageable);
        }
        return callLogRepository.findAll(pageable);
    }

    public Page<CallLog> getReceivedCalls(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return callLogRepository.findByStatus(CallStatus.RECEIVED, pageable);
    }

    public Page<CallLog> getRejectedCalls(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return callLogRepository.findByStatus(CallStatus.REJECTED, pageable);
    }

    public Page<CallLog> getMissedCalls(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return callLogRepository.findByStatus(CallStatus.MISSED, pageable);
    }

    // ==================== REPORTS ====================

    public Map<String, Object> getReceivedCallsReport() {
        List<CallLog> calls = callLogRepository.findByStatus(CallStatus.RECEIVED);

        Map<String, Object> report = new HashMap<>();
        report.put("companyName", "PEACE OF MIND ELECTRONICS");
        report.put("address", "64 OGUI ROAD, ENUGU-STATE");
        report.put("tel", "080XXXXXX");
        report.put("reportTitle", "ALL RECEIVED CALLS REPORT");
        report.put("calls", calls);

        return report;
    }

    public Map<String, Object> getUnansweredCallsReport() {
        List<CallLog> calls = callLogRepository.findByStatusIn(List.of(CallStatus.MISSED, CallStatus.REJECTED));

        Map<String, Object> report = new HashMap<>();
        report.put("companyName", "PEACE OF MIND ELECTRONICS");
        report.put("address", "64 OGUI ROAD, ENUGU-STATE");
        report.put("tel", "080XXXXXX");
        report.put("reportTitle", "ALL UNANSWERED CALLS REPORT");
        report.put("calls", calls);

        return report;
    }

    // ==================== SOCIAL MEDIA ====================

    public List<SocialMedia> getSocialMediaLinks() {
        return socialMediaRepository.findAll();
    }
}

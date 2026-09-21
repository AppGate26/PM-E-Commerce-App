package com.appGate.customercare.controller;

import com.appGate.customercare.dto.*;
import com.appGate.customercare.models.*;
import com.appGate.customercare.service.CustomerCareService;
import com.appGate.orderingsales.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class CustomerCareController {

    private final CustomerCareService customerCareService;

    // ==================== LIVE CHAT ====================

    @GetMapping("/chats")
    public BaseResponse getChatList() {
        List<ChatConversation> chats = customerCareService.getChatList();
        return new BaseResponse(HttpStatus.OK.value(), "successful", chats);
    }

    // Create a new chat conversation (returns the chat with its id so the UI can start messaging).
    @PostMapping("/chats")
    public BaseResponse createChat(@RequestBody CreateChatDto dto) {
        ChatConversation chat = customerCareService.createChat(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", chat);
    }

    @GetMapping("/chats/{chatId}/messages")
    public BaseResponse getChatMessages(@PathVariable Long chatId) {
        List<ChatMessage> messages = customerCareService.getChatMessages(chatId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", messages);
    }

    @PostMapping("/chats/{chatId}/messages")
    public BaseResponse sendChatMessage(@PathVariable Long chatId, @RequestBody ChatMessageDto dto) {
        ChatMessage message = customerCareService.sendChatMessage(chatId, dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", message);
    }

    @GetMapping("/chats/count")
    public BaseResponse getChatCount() {
        Map<String, Object> count = customerCareService.getChatCount();
        return new BaseResponse(HttpStatus.OK.value(), "successful", count);
    }

    // ---- Customer self-service: scoped to the signed-in caller, never to a client-supplied id.
    // A customer calling these always lands in their own conversation, so different users can
    // never end up sharing (or writing into) someone else's chat.

    @GetMapping("/chats/mine")
    public BaseResponse getMyChat() {
        ChatConversation chat = customerCareService.getOrCreateMyChat();
        return new BaseResponse(HttpStatus.OK.value(), "successful", chat);
    }

    @GetMapping("/chats/mine/messages")
    public BaseResponse getMyChatMessages() {
        List<ChatMessage> messages = customerCareService.getMyChatMessages();
        return new BaseResponse(HttpStatus.OK.value(), "successful", messages);
    }

    @PostMapping("/chats/mine/messages")
    public BaseResponse sendMyChatMessage(@RequestBody ChatMessageDto dto) {
        ChatMessage message = customerCareService.sendMyChatMessage(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", message);
    }

    // ==================== EMAIL SUPPORT ====================

    @GetMapping("/emails")
    public BaseResponse getEmailTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<EmailTicket> tickets = customerCareService.getEmailTickets(page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", tickets);
    }

    @GetMapping("/emails/{ticketId}")
    public BaseResponse getEmailTicketDetails(@PathVariable Long ticketId) {
        EmailTicket ticket = customerCareService.getEmailTicketDetails(ticketId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", ticket);
    }

    @PostMapping("/emails/{ticketId}/reply")
    public BaseResponse replyToEmailTicket(@PathVariable Long ticketId, @RequestBody EmailReplyDto dto) {
        EmailTicket ticket = customerCareService.replyToEmailTicket(ticketId, dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", ticket);
    }

    // ==================== PHONE SUPPORT ====================

    @GetMapping("/calls/incoming")
    public BaseResponse getIncomingCalls() {
        List<CallLog> calls = customerCareService.getIncomingCalls();
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    @PostMapping("/calls/{callId}/accept")
    public BaseResponse acceptCall(@PathVariable Long callId) {
        CallLog call = customerCareService.acceptCall(callId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", call);
    }

    @PostMapping("/calls/{callId}/decline")
    public BaseResponse declineCall(@PathVariable Long callId) {
        CallLog call = customerCareService.declineCall(callId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", call);
    }

    @PostMapping("/calls/{callId}/end")
    public BaseResponse endCall(@PathVariable Long callId, @RequestBody EndCallDto dto) {
        CallLog call = customerCareService.endCall(callId, dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", call);
    }

    @GetMapping("/calls/queue")
    public BaseResponse getCallQueue() {
        List<CallLog> calls = customerCareService.getCallQueue();
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    @GetMapping("/calls/ignored")
    public BaseResponse getIgnoredCalls() {
        List<CallLog> calls = customerCareService.getIgnoredCalls();
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    // ==================== CALL LOG ====================

    @GetMapping("/call-log")
    public BaseResponse getAllCalls(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CallLog> calls = customerCareService.getAllCalls(status, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    @GetMapping("/call-log/received")
    public BaseResponse getReceivedCalls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CallLog> calls = customerCareService.getReceivedCalls(page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    @GetMapping("/call-log/rejected")
    public BaseResponse getRejectedCalls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CallLog> calls = customerCareService.getRejectedCalls(page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    @GetMapping("/call-log/missed")
    public BaseResponse getMissedCalls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CallLog> calls = customerCareService.getMissedCalls(page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", calls);
    }

    // ==================== REPORTS ====================

    @GetMapping("/reports/received-calls")
    public BaseResponse getReceivedCallsReport() {
        Map<String, Object> report = customerCareService.getReceivedCallsReport();
        return new BaseResponse(HttpStatus.OK.value(), "successful", report);
    }

    @GetMapping("/reports/unanswered-calls")
    public BaseResponse getUnansweredCallsReport() {
        Map<String, Object> report = customerCareService.getUnansweredCallsReport();
        return new BaseResponse(HttpStatus.OK.value(), "successful", report);
    }

    // ==================== SOCIAL MEDIA ====================

    @GetMapping("/social-media")
    public BaseResponse getSocialMediaLinks() {
        List<SocialMedia> links = customerCareService.getSocialMediaLinks();
        return new BaseResponse(HttpStatus.OK.value(), "successful", links);
    }

    @PostMapping("/social-media")
    public BaseResponse createSocialMedia(@RequestBody SocialMediaDto dto) {
        return new BaseResponse(HttpStatus.CREATED.value(), "Social media link created",
                customerCareService.createSocialMedia(dto));
    }

    @PutMapping("/social-media/{id}")
    public BaseResponse updateSocialMedia(@PathVariable Long id, @RequestBody SocialMediaDto dto) {
        return new BaseResponse(HttpStatus.OK.value(), "Social media link updated",
                customerCareService.updateSocialMedia(id, dto));
    }

    @DeleteMapping("/social-media/{id}")
    public BaseResponse deleteSocialMedia(@PathVariable Long id) {
        customerCareService.deleteSocialMedia(id);
        return new BaseResponse(HttpStatus.OK.value(), "Social media link removed", null);
    }

    // ==================== ESCALATIONS ====================

    @PostMapping("/escalations")
    public BaseResponse createEscalation(@RequestBody CreateEscalationDto dto) {
        return new BaseResponse(HttpStatus.CREATED.value(), "Escalation submitted",
                customerCareService.createEscalation(dto));
    }

    @GetMapping("/escalations")
    public BaseResponse getEscalations(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) com.appGate.customercare.enums.EscalationStatus status) {
        return new BaseResponse(HttpStatus.OK.value(), "successful",
                customerCareService.getEscalations(department, status));
    }

    @PatchMapping("/escalations/{id}/resolve")
    public BaseResponse resolveEscalation(@PathVariable Long id) {
        return new BaseResponse(HttpStatus.OK.value(), "Escalation resolved",
                customerCareService.resolveEscalation(id));
    }
}

package com.appGate.mail.service;

import com.appGate.mail.dto.ComposeMailDto;
import com.appGate.mail.dto.MailDisplayOptionDto;
import com.appGate.mail.dto.MailSettingsDto;
import com.appGate.mail.enums.MailTypeEnum;
import com.appGate.mail.models.InternalMail;
import com.appGate.mail.models.MailSettings;
import com.appGate.mail.repository.InternalMailRepository;
import com.appGate.mail.repository.MailSettingsRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InternalMailService {

    private final InternalMailRepository internalMailRepository;
    private final MailSettingsRepository mailSettingsRepository;
    private final UserRepository userRepository;

    public InternalMailService(InternalMailRepository internalMailRepository,
                               MailSettingsRepository mailSettingsRepository,
                               UserRepository userRepository) {
        this.internalMailRepository = internalMailRepository;
        this.mailSettingsRepository = mailSettingsRepository;
        this.userRepository = userRepository;
    }

    // ==================== INBOX ====================

    public BaseResponse getInbox(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InternalMail> inbox = internalMailRepository
                .findByRecipientIdAndIsDeletedByRecipientFalseOrderBySentAtDesc(userId, pageable);

        return new BaseResponse(HttpStatus.OK.value(), "successful", inbox);
    }

    public BaseResponse getInboxAll(Long userId) {
        List<InternalMail> inbox = internalMailRepository
                .findByRecipientIdAndIsDeletedByRecipientFalseOrderBySentAtDesc(userId);

        return new BaseResponse(HttpStatus.OK.value(), "successful", inbox);
    }

    public BaseResponse getUnreadCount(Long userId) {
        Long count = internalMailRepository
                .countByRecipientIdAndIsReadFalseAndIsDeletedByRecipientFalse(userId);

        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // ==================== SENT MESSAGES ====================

    public BaseResponse getSentMessages(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InternalMail> sent = internalMailRepository
                .findBySenderIdAndIsDeletedBySenderFalseOrderBySentAtDesc(userId, pageable);

        return new BaseResponse(HttpStatus.OK.value(), "successful", sent);
    }

    public BaseResponse getSentMessagesAll(Long userId) {
        List<InternalMail> sent = internalMailRepository
                .findBySenderIdAndIsDeletedBySenderFalseOrderBySentAtDesc(userId);

        return new BaseResponse(HttpStatus.OK.value(), "successful", sent);
    }

    // ==================== VIEW SINGLE MESSAGE ====================

    public BaseResponse getMessage(Long userId, Long messageId) {
        InternalMail mail = internalMailRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        // Check if user is sender or recipient
        if (!mail.getSender().getId().equals(userId) && !mail.getRecipient().getId().equals(userId)) {
            return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure", "Access denied");
        }

        // Mark as read if recipient is viewing
        if (mail.getRecipient().getId().equals(userId) && !mail.getIsRead()) {
            mail.setIsRead(true);
            internalMailRepository.save(mail);
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", mail);
    }

    // ==================== COMPOSE / SEND MESSAGE ====================

    public BaseResponse sendMessage(Long senderId, ComposeMailDto dto) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        User recipient = userRepository.findById(dto.getRecipientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        InternalMail mail = new InternalMail();
        mail.setSender(sender);
        mail.setRecipient(recipient);
        mail.setSubject(dto.getSubject());
        mail.setMessage(dto.getMessage());
        mail.setSentAt(LocalDateTime.now());
        mail.setIsRead(false);

        internalMailRepository.save(mail);

        return new BaseResponse(HttpStatus.CREATED.value(), "successful", "Message sent successfully");
    }

    // ==================== DELETE MESSAGE ====================

    public BaseResponse deleteMessage(Long userId, Long messageId) {
        InternalMail mail = internalMailRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        // Mark as deleted for the appropriate user
        if (mail.getSender().getId().equals(userId)) {
            mail.setIsDeletedBySender(true);
        } else if (mail.getRecipient().getId().equals(userId)) {
            mail.setIsDeletedByRecipient(true);
        } else {
            return new BaseResponse(HttpStatus.FORBIDDEN.value(), "failure", "Access denied");
        }

        // If both deleted, remove from database
        if (mail.getIsDeletedBySender() && mail.getIsDeletedByRecipient()) {
            internalMailRepository.delete(mail);
        } else {
            internalMailRepository.save(mail);
        }

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Message deleted successfully");
    }

    // ==================== MAIL SETTINGS ====================

    public BaseResponse getMailSettings(Long userId) {
        MailSettings settings = mailSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultMailSettings(userId));

        return new BaseResponse(HttpStatus.OK.value(), "successful", settings);
    }

    public BaseResponse updateMailSettings(Long userId, MailSettingsDto dto) {
        MailSettings settings = mailSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultMailSettings(userId));

        if (dto.getEmailAddress() != null) {
            settings.setEmailAddress(dto.getEmailAddress());
        }
        if (dto.getSenderName() != null) {
            settings.setSenderName(dto.getSenderName());
        }
        if (dto.getSmtpEmailAddress() != null) {
            settings.setSmtpEmailAddress(dto.getSmtpEmailAddress());
        }
        if (dto.getSmtpEmailPassword() != null) {
            settings.setSmtpEmailPassword(dto.getSmtpEmailPassword());
        }
        if (dto.getSmtpSenderName() != null) {
            settings.setSmtpSenderName(dto.getSmtpSenderName());
        }
        if (dto.getMailDisplayOption() != null) {
            settings.setMailDisplayOption(dto.getMailDisplayOption());
        }

        mailSettingsRepository.save(settings);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Mail settings updated successfully");
    }

    public BaseResponse updateMailDisplayOption(Long userId, MailDisplayOptionDto dto) {
        MailSettings settings = mailSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultMailSettings(userId));

        settings.setMailDisplayOption(dto.getMailDisplayOption());
        mailSettingsRepository.save(settings);

        return new BaseResponse(HttpStatus.OK.value(), "successful", "Mail display option updated successfully");
    }

    public BaseResponse getMailDisplayOptions() {
        return new BaseResponse(HttpStatus.OK.value(), "successful", MailTypeEnum.values());
    }

    // ==================== GET USERS FOR COMPOSE ====================

    public BaseResponse getUsersForCompose() {
        List<User> users = userRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "successful", users);
    }

    private MailSettings createDefaultMailSettings(Long userId) {
        MailSettings settings = new MailSettings();
        settings.setUserId(userId);
        settings.setMailDisplayOption(MailTypeEnum.INTERNAL);
        return mailSettingsRepository.save(settings);
    }
}

package com.appGate.goodsrecovery.service;

import com.appGate.goodsrecovery.dto.CreateReminderDto;
import com.appGate.goodsrecovery.dto.UpdateReminderDto;
import com.appGate.goodsrecovery.enums.RecipientType;
import com.appGate.goodsrecovery.enums.RelatedEntityType;
import com.appGate.goodsrecovery.enums.ReminderType;
import com.appGate.goodsrecovery.models.Reminder;
import com.appGate.goodsrecovery.repository.ReminderRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;

    public ReminderService(ReminderRepository reminderRepository) {
        this.reminderRepository = reminderRepository;
    }

    public BaseResponse createReminder(CreateReminderDto dto) {
        Reminder reminder = new Reminder();
        reminder.setRecipientType(dto.getRecipientType());
        reminder.setRecipientId(dto.getRecipientId());
        reminder.setRecipientName(dto.getRecipientName());
        reminder.setRecipientEmail(dto.getRecipientEmail());
        reminder.setRecipientPhone(dto.getRecipientPhone());
        reminder.setReminderType(dto.getReminderType());
        reminder.setMessage(dto.getMessage());
        reminder.setScheduledDate(dto.getScheduledDate() != null ? dto.getScheduledDate() : LocalDateTime.now());
        reminder.setRelatedEntityType(dto.getRelatedEntityType());
        reminder.setRelatedEntityId(dto.getRelatedEntityId());
        reminder.setNotes(dto.getNotes());
        reminder.setIsSent(false);

        Reminder savedReminder = reminderRepository.save(reminder);
        return new BaseResponse(HttpStatus.CREATED.value(), "Reminder created successfully", savedReminder);
    }

    public BaseResponse getAllReminders() {
        List<Reminder> reminders = reminderRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Reminders retrieved successfully", reminders);
    }

    public BaseResponse getReminderById(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Reminder retrieved successfully", reminder);
    }

    public BaseResponse getRemindersByRecipient(Long recipientId, RecipientType recipientType) {
        List<Reminder> reminders = reminderRepository.findByRecipientIdAndRecipientTypeOrderByScheduledDateDesc(
                recipientId, recipientType);
        return new BaseResponse(HttpStatus.OK.value(), "Recipient reminders retrieved successfully", reminders);
    }

    public BaseResponse getRemindersByRecipientType(RecipientType recipientType) {
        List<Reminder> reminders = reminderRepository.findByRecipientTypeOrderByScheduledDateDesc(recipientType);
        return new BaseResponse(HttpStatus.OK.value(), "Reminders by recipient type retrieved successfully", reminders);
    }

    public BaseResponse getPendingReminders() {
        List<Reminder> reminders = reminderRepository.findByIsSentOrderByScheduledDateDesc(false);
        return new BaseResponse(HttpStatus.OK.value(), "Pending reminders retrieved successfully", reminders);
    }

    public BaseResponse getSentReminders() {
        List<Reminder> reminders = reminderRepository.findByIsSentOrderByScheduledDateDesc(true);
        return new BaseResponse(HttpStatus.OK.value(), "Sent reminders retrieved successfully", reminders);
    }

    public BaseResponse getRemindersDueForSending() {
        List<Reminder> reminders = reminderRepository.findByScheduledDateBeforeAndIsSent(
                LocalDateTime.now(), false);
        return new BaseResponse(HttpStatus.OK.value(), "Reminders due for sending retrieved successfully", reminders);
    }

    public BaseResponse getRemindersByType(ReminderType reminderType, Boolean isSent) {
        List<Reminder> reminders;
        if (isSent != null) {
            reminders = reminderRepository.findByReminderTypeAndIsSentOrderByScheduledDateDesc(reminderType, isSent);
        } else {
            reminders = reminderRepository.findAll().stream()
                    .filter(r -> r.getReminderType() == reminderType)
                    .toList();
        }
        return new BaseResponse(HttpStatus.OK.value(), "Reminders by type retrieved successfully", reminders);
    }

    public BaseResponse getRemindersByRelatedEntity(RelatedEntityType entityType, Long entityId) {
        List<Reminder> reminders = reminderRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderByScheduledDateDesc(
                entityType, entityId);
        return new BaseResponse(HttpStatus.OK.value(), "Related entity reminders retrieved successfully", reminders);
    }

    public BaseResponse markReminderAsSent(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));

        if (reminder.getIsSent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reminder already sent");
        }

        reminder.setIsSent(true);
        reminder.setSentDate(LocalDateTime.now());
        Reminder updatedReminder = reminderRepository.save(reminder);

        return new BaseResponse(HttpStatus.OK.value(), "Reminder marked as sent successfully", updatedReminder);
    }

    public BaseResponse updateReminder(Long id, UpdateReminderDto dto) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));

        if (dto.getMessage() != null) {
            reminder.setMessage(dto.getMessage());
        }
        if (dto.getScheduledDate() != null) {
            reminder.setScheduledDate(dto.getScheduledDate());
        }
        if (dto.getRecipientName() != null) {
            reminder.setRecipientName(dto.getRecipientName());
        }
        if (dto.getRecipientEmail() != null) {
            reminder.setRecipientEmail(dto.getRecipientEmail());
        }
        if (dto.getRecipientPhone() != null) {
            reminder.setRecipientPhone(dto.getRecipientPhone());
        }
        if (dto.getNotes() != null) {
            reminder.setNotes(dto.getNotes());
        }

        Reminder savedReminder = reminderRepository.save(reminder);
        return new BaseResponse(HttpStatus.OK.value(), "Reminder updated successfully", savedReminder);
    }

    public BaseResponse deleteReminder(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));

        reminderRepository.delete(reminder);
        return new BaseResponse(HttpStatus.OK.value(), "Reminder deleted successfully", null);
    }
}

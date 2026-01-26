package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.dto.CreateReminderDto;
import com.appGate.goodsrecovery.dto.UpdateReminderDto;
import com.appGate.goodsrecovery.enums.RecipientType;
import com.appGate.goodsrecovery.enums.RelatedEntityType;
import com.appGate.goodsrecovery.enums.ReminderType;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.ReminderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reminders")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping
    public BaseResponse createReminder(@Valid @RequestBody CreateReminderDto dto) {
        return reminderService.createReminder(dto);
    }

    @GetMapping
    public BaseResponse getAllReminders() {
        return reminderService.getAllReminders();
    }

    @GetMapping("/{id}")
    public BaseResponse getReminderById(@PathVariable Long id) {
        return reminderService.getReminderById(id);
    }

    @GetMapping("/recipient/{recipientId}")
    public BaseResponse getRemindersByRecipient(
            @PathVariable Long recipientId,
            @RequestParam RecipientType recipientType) {
        return reminderService.getRemindersByRecipient(recipientId, recipientType);
    }

    @GetMapping("/recipient-type/{recipientType}")
    public BaseResponse getRemindersByRecipientType(@PathVariable RecipientType recipientType) {
        return reminderService.getRemindersByRecipientType(recipientType);
    }

    @GetMapping("/pending")
    public BaseResponse getPendingReminders() {
        return reminderService.getPendingReminders();
    }

    @GetMapping("/sent")
    public BaseResponse getSentReminders() {
        return reminderService.getSentReminders();
    }

    @GetMapping("/due")
    public BaseResponse getRemindersDueForSending() {
        return reminderService.getRemindersDueForSending();
    }

    @GetMapping("/type/{reminderType}")
    public BaseResponse getRemindersByType(
            @PathVariable ReminderType reminderType,
            @RequestParam(required = false) Boolean isSent) {
        return reminderService.getRemindersByType(reminderType, isSent);
    }

    @GetMapping("/related-entity")
    public BaseResponse getRemindersByRelatedEntity(
            @RequestParam RelatedEntityType entityType,
            @RequestParam Long entityId) {
        return reminderService.getRemindersByRelatedEntity(entityType, entityId);
    }

    @PutMapping("/{id}/mark-sent")
    public BaseResponse markReminderAsSent(@PathVariable Long id) {
        return reminderService.markReminderAsSent(id);
    }

    @PutMapping("/{id}")
    public BaseResponse updateReminder(@PathVariable Long id, @Valid @RequestBody UpdateReminderDto dto) {
        return reminderService.updateReminder(id, dto);
    }

    @DeleteMapping("/{id}")
    public BaseResponse deleteReminder(@PathVariable Long id) {
        return reminderService.deleteReminder(id);
    }
}

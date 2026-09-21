package com.appGate.account.controller;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.JournalEntryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/journal-entries")
@RequiredArgsConstructor
@Tag(name = "Account Management - Journal Entries", description = "Journal entry creation and management")
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    @Operation(summary = "Create journal entry", description = "Create new journal entry with debit/credit lines")
    @PostMapping
    public BaseResponse createJournalEntry(
            @Valid @RequestBody CreateJournalEntryDto dto,
            @RequestParam Long userId) {
        return journalEntryService.createJournalEntry(dto, userId);
    }

    @Operation(summary = "Get all journal entries", description = "Retrieve all journal entries in the system")
    @GetMapping
    public BaseResponse getAllJournalEntries() {
        return journalEntryService.getAllJournalEntries();
    }

    @Operation(summary = "Get next journal reference", description = "Preview the next auto-generated journal reference")
    @GetMapping("/next-reference")
    public BaseResponse getNextReference() {
        return journalEntryService.getNextReference();
    }

    @Operation(summary = "Get journal entry by ID", description = "Retrieve a specific journal entry by its ID")
    @GetMapping("/{id}")
    public BaseResponse getJournalEntryById(@PathVariable Long id) {
        return journalEntryService.getJournalEntryById(id);
    }

    @Operation(summary = "Get journal entries by date range", description = "Filter journal entries by date range")
    @GetMapping("/date-range")
    public BaseResponse getJournalEntriesByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        return journalEntryService.getJournalEntriesByDateRange(startDate, endDate);
    }

    @Operation(summary = "Patch journal entry", description = "Update description / date of an unapproved journal entry")
    @PatchMapping("/{id}")
    public BaseResponse patchJournalEntry(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> updates) {
        return journalEntryService.patchJournalEntry(id, updates);
    }

    @Operation(summary = "Replace journal entry lines", description = "Full replacement of lines on an unapproved journal entry")
    @PutMapping("/{id}")
    public BaseResponse updateJournalEntry(
            @PathVariable Long id,
            @Valid @RequestBody CreateJournalEntryDto dto,
            @RequestParam Long userId) {
        return journalEntryService.updateJournalEntry(id, dto, userId);
    }

    @Operation(summary = "Approve journal entry", description = "Approve a pending journal entry")
    @PatchMapping("/{id}/approve")
    public BaseResponse approveJournalEntry(
            @PathVariable Long id,
            @RequestParam Long approvedBy) {
        return journalEntryService.approveJournalEntry(id, approvedBy);
    }

    @Operation(summary = "Delete journal entry", description = "Delete an unapproved journal entry")
    @DeleteMapping("/{id}")
    public BaseResponse deleteJournalEntry(@PathVariable Long id) {
        return journalEntryService.deleteJournalEntry(id);
    }
}

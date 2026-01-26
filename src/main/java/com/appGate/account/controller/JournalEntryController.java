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

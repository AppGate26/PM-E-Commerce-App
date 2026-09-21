package com.appGate.account.dto;

import com.appGate.account.enums.JournalType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateJournalEntryDto {

    // Optional client-supplied reference; when blank the service generates one.
    private String journalReference;

    @NotNull(message = "Journal type is required")
    private JournalType journalType;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    private String description;

    /**
     * The branch this entry is posted for. Ignored for a branch user, who always
     * posts into their own branch; an admin may use it to post on behalf of a
     * named branch, and may leave it null for a head-office entry.
     */
    private Long branchId;

    @NotEmpty(message = "At least one journal line is required")
    @Valid
    private List<JournalLineDto> journalLines;
}

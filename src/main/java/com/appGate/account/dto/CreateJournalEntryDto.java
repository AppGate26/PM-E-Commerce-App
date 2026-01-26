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

    @NotNull(message = "Journal type is required")
    private JournalType journalType;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    private String description;

    @NotEmpty(message = "At least one journal line is required")
    @Valid
    private List<JournalLineDto> journalLines;
}

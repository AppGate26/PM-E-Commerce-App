package com.appGate.account.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A ledger row enriched with the entry-level fields (date, reference, posted/approved by)
 * that {@link com.appGate.account.models.JournalLine} can't expose on its own: its
 * {@code journalEntry} association is {@code @JsonBackReference} and would otherwise be
 * dropped from the response entirely.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountLedgerLineDto {

    private Long id;
    private Long journalEntryId;
    private LocalDate transactionDate;
    private String referenceNo;
    private String sourceType;
    private String description;
    private Long accountId;
    private String accountCode;
    private String accountName;
    private String customerName;
    private BigDecimal debit;
    private BigDecimal credit;
    private String postedBy;
    private String approvedBy;
    private Boolean isApproved;
}

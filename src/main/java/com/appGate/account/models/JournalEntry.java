package com.appGate.account.models;

import com.appGate.account.enums.JournalType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
@Data
@EqualsAndHashCode(callSuper = true)
public class JournalEntry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "journal_reference", unique = true, nullable = false)
    private String journalReference; // e.g., "JE-2025-0001"

    @Enumerated(EnumType.STRING)
    @Column(name = "journal_type", nullable = false)
    private JournalType journalType; // GENERAL_JOURNAL, LIST, INDIVIDUAL

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "posted_by")
    private Long postedBy; // User ID who created the entry

    @Column(name = "approved_by")
    private Long approvedBy; // User ID who approved

    @Column(name = "is_approved")
    private Boolean isApproved = false;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private List<JournalLine> journalLines = new ArrayList<>();
}

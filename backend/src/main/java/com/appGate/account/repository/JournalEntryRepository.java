package com.appGate.account.repository;

import com.appGate.account.enums.JournalType;
import com.appGate.account.models.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByJournalReference(String journalReference);

    List<JournalEntry> findByJournalType(JournalType journalType);

    List<JournalEntry> findByTransactionDateBetween(LocalDate startDate, LocalDate endDate);

    List<JournalEntry> findByIsApproved(Boolean isApproved);

    List<JournalEntry> findByPostedBy(Long userId);

    // Branch-scoped journal (Branch module: branch account view + report)
    List<JournalEntry> findByBranchIdOrderByTransactionDateDesc(Long branchId);

    List<JournalEntry> findByBranchIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long branchId, LocalDate startDate, LocalDate endDate);
}

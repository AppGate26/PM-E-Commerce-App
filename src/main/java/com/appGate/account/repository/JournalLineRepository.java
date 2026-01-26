package com.appGate.account.repository;

import com.appGate.account.models.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Long> {

    List<JournalLine> findByAccountId(Long accountId);

    List<JournalLine> findByUserId(Long userId);

    @Query("SELECT jl FROM JournalLine jl JOIN jl.journalEntry je WHERE je.transactionDate BETWEEN :startDate AND :endDate ORDER BY je.transactionDate")
    List<JournalLine> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN jl.journalEntry je WHERE jl.account.id = :accountId AND je.transactionDate BETWEEN :startDate AND :endDate ORDER BY je.transactionDate")
    List<JournalLine> findByAccountAndDateRange(Long accountId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN jl.journalEntry je WHERE jl.userId = :userId AND je.transactionDate BETWEEN :startDate AND :endDate ORDER BY je.transactionDate")
    List<JournalLine> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);
}

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

    // Dates are optional (null = unbounded) so a caller can pull an account's full
    // history without having to know its earliest posting date up front.
    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) ORDER BY je.transactionDate")
    List<JournalLine> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE jl.account.id = :accountId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) ORDER BY je.transactionDate")
    List<JournalLine> findByAccountAndDateRange(Long accountId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE jl.userId = :userId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) ORDER BY je.transactionDate")
    List<JournalLine> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate);

    // --- Branch-scoped ---
    // A line belongs to a branch through the entry that posted it.

    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE je.branchId = :branchId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) "
            + "ORDER BY je.transactionDate")
    List<JournalLine> findByBranchAndDateRange(Long branchId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE jl.account.id = :accountId AND je.branchId = :branchId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) ORDER BY je.transactionDate")
    List<JournalLine> findByAccountAndDateRangeForBranch(Long accountId, Long branchId,
                                                         LocalDate startDate, LocalDate endDate);

    @Query("SELECT jl FROM JournalLine jl JOIN FETCH jl.journalEntry je "
            + "WHERE jl.userId = :userId AND je.branchId = :branchId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) ORDER BY je.transactionDate")
    List<JournalLine> findByUserAndDateRangeForBranch(Long userId, Long branchId,
                                                      LocalDate startDate, LocalDate endDate);

    /**
     * Per-account debit/credit totals for one branch, up to a date.
     *
     * <p>Rows are {@code [accountId, totalDebit, totalCredit]}. This is what makes
     * a branch trial balance / P&L possible against a shared chart of accounts:
     * {@code Account.balance} is a single company-wide figure and cannot answer
     * "what is this account's balance <em>at my branch</em>".
     */
    @Query("SELECT jl.account.id, COALESCE(SUM(jl.debit), 0), COALESCE(SUM(jl.credit), 0) "
            + "FROM JournalLine jl JOIN jl.journalEntry je "
            + "WHERE je.branchId = :branchId AND (:asOfDate IS NULL OR je.transactionDate <= :asOfDate) "
            + "GROUP BY jl.account.id")
    List<Object[]> sumByAccountForBranch(Long branchId, LocalDate asOfDate);

    /** As {@link #sumByAccountForBranch} but bounded by a date range (for P&L). */
    @Query("SELECT jl.account.id, COALESCE(SUM(jl.debit), 0), COALESCE(SUM(jl.credit), 0) "
            + "FROM JournalLine jl JOIN jl.journalEntry je "
            + "WHERE je.branchId = :branchId "
            + "AND (:startDate IS NULL OR je.transactionDate >= :startDate) "
            + "AND (:endDate IS NULL OR je.transactionDate <= :endDate) "
            + "GROUP BY jl.account.id")
    List<Object[]> sumByAccountForBranchBetween(Long branchId, LocalDate startDate, LocalDate endDate);
}

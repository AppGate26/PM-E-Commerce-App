package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.models.CustomerLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CustomerLedgerRepository extends JpaRepository<CustomerLedger, Long> {

    List<CustomerLedger> findByCustomerId(Long customerId);

    CustomerLedger findFirstByCustomerIdOrderByIdDesc(Long customerId);

    Page<CustomerLedger> findByCustomerIdAndTransactionDateBetween(
            Long customerId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<CustomerLedger> findByAccountNameContainingIgnoreCase(String accountName);

    // --- Branch-scoped ---
    List<CustomerLedger> findByCustomerIdAndBranchId(Long customerId, Long branchId);

    Page<CustomerLedger> findByCustomerIdAndBranchIdAndTransactionDateBetween(
            Long customerId, Long branchId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<CustomerLedger> findByAccountNameContainingIgnoreCaseAndBranchId(
            String accountName, Long branchId);

    // Ledger rows written before branch-scoping still carry a NULL branch_id
    // (same manual-backfill gap as CustomerRepository). Match NULL alongside the
    // caller's branch so legacy transactions stay visible until that backfill runs.
    @Query("SELECT c FROM CustomerLedger c WHERE c.customerId = :customerId AND (c.branchId = :branchId OR c.branchId IS NULL)")
    List<CustomerLedger> findByCustomerIdAndBranchIdIncludingUnassigned(
            @Param("customerId") Long customerId, @Param("branchId") Long branchId);

    @Query("SELECT c FROM CustomerLedger c WHERE c.customerId = :customerId AND (c.branchId = :branchId OR c.branchId IS NULL) "
            + "AND c.transactionDate BETWEEN :startDate AND :endDate")
    Page<CustomerLedger> findByCustomerIdAndBranchIdIncludingUnassignedAndTransactionDateBetween(
            @Param("customerId") Long customerId, @Param("branchId") Long branchId,
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    @Query("SELECT c FROM CustomerLedger c WHERE LOWER(c.accountName) LIKE LOWER(CONCAT('%', :accountName, '%')) "
            + "AND (c.branchId = :branchId OR c.branchId IS NULL)")
    List<CustomerLedger> findByAccountNameContainingIgnoreCaseAndBranchIdIncludingUnassigned(
            @Param("accountName") String accountName, @Param("branchId") Long branchId);
}

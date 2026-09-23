package com.appGate.account.repository;

import com.appGate.account.models.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(Long userId);

    /**
     * Locks the wallet row for the rest of the transaction. Balance changes are
     * read-check-write, so two concurrent debits (two devices, or a retry after a timeout)
     * could both pass the balance check and the second save would overwrite the first -
     * one payment collected, the other silently lost.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(Long userId);

    boolean existsByUserId(Long userId);

    Optional<Wallet> findByCustomerId(Long customerId);

    boolean existsByCustomerId(Long customerId);

    Optional<Wallet> findByAccountNumber(String accountNumber);

    @Query("SELECT SUM(w.balance) FROM Wallet w WHERE w.isActive = true")
    Double sumAllActiveBalances();

    Page<Wallet> findAllByIsActiveTrue(Pageable pageable);

    // --- Branch-scoped ---
    Page<Wallet> findAllByIsActiveTrueAndBranchId(Long branchId, Pageable pageable);

    @Query("SELECT SUM(w.balance) FROM Wallet w WHERE w.isActive = true AND w.branchId = :branchId")
    Double sumActiveBalancesByBranch(Long branchId);
}

package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.enums.BankName;
import com.appGate.cashierstand.enums.TransactionType;
import com.appGate.cashierstand.models.DepositTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DepositTransactionRepository extends JpaRepository<DepositTransaction, Long> {

    Page<DepositTransaction> findByTransactionDateBetween(
            LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<DepositTransaction> findByTransactionTypeAndTransactionDateBetween(
            TransactionType type, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<DepositTransaction> findByBankNameAndTransactionDateBetween(
            BankName bank, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<DepositTransaction> findByCashierAndTransactionDateBetween(
            String cashier, LocalDate startDate, LocalDate endDate);

    @Query("SELECT SUM(d.amount) FROM DepositTransaction d WHERE d.cashier = :cashier " +
           "AND d.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByCashierAndDateRange(
            @Param("cashier") String cashier,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}

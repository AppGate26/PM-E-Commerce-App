package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.models.CustomerLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CustomerLedgerRepository extends JpaRepository<CustomerLedger, Long> {

    List<CustomerLedger> findByCustomerId(Long customerId);

    Page<CustomerLedger> findByCustomerIdAndTransactionDateBetween(
            Long customerId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<CustomerLedger> findByAccountNameContainingIgnoreCase(String accountName);
}

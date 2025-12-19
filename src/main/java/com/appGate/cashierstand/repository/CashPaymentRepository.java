package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.models.CashPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CashPaymentRepository extends JpaRepository<CashPayment, Long> {

    Optional<CashPayment> findByReferenceNumber(String referenceNumber);
}

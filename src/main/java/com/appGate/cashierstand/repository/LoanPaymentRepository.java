package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.models.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {

    List<LoanPayment> findByAccountNumber(String accountNumber);
}

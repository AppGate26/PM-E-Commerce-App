package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.models.LoanDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanDetailsRepository extends JpaRepository<LoanDetails, Long> {

    Optional<LoanDetails> findBySalesOrderId(Long salesOrderId);
}

package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.models.LoanRepaymentEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LoanRepaymentEntryRepository extends JpaRepository<LoanRepaymentEntry, Long> {
    List<LoanRepaymentEntry> findByLoanDetailsIdOrderByEntryNumberAsc(Long loanDetailsId);

    @Query("SELECT COALESCE(SUM(e.amountPaid), 0) FROM LoanRepaymentEntry e WHERE e.loanDetails.id = :loanDetailsId AND e.status = 'PAID'")
    BigDecimal sumAmountPaidByLoanDetailsId(@Param("loanDetailsId") Long loanDetailsId);
}

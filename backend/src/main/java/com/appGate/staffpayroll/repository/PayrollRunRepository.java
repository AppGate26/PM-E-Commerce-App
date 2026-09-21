package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.enums.PayrollStatus;
import com.appGate.staffpayroll.models.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    Optional<PayrollRun> findByPeriod(String period);
    List<PayrollRun> findByStatus(PayrollStatus status);

    // --- Branch-scoped ---
    // Each branch runs its own payroll, so a period is only unique *within* a
    // branch: two branches must both be able to run "2026-07". Head-office runs
    // carry a null branch, hence the separate finder.
    Optional<PayrollRun> findByPeriodAndBranchId(String period, Long branchId);
    Optional<PayrollRun> findByPeriodAndBranchIdIsNull(String period);

    List<PayrollRun> findByBranchId(Long branchId);
    List<PayrollRun> findByBranchIdAndStatus(Long branchId, PayrollStatus status);
}

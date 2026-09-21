package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.PayrollEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollEntryRepository extends JpaRepository<PayrollEntry, Long> {
    List<PayrollEntry> findByPayrollRunId(Long payrollRunId);
    Optional<PayrollEntry> findByPayrollRunIdAndStaffId(Long payrollRunId, Long staffId);
    List<PayrollEntry> findByStaffId(Long staffId);
}

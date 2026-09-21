package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.StaffAdvance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StaffAdvanceRepository extends JpaRepository<StaffAdvance, Long> {
    List<StaffAdvance> findByStaffId(Long staffId);
    List<StaffAdvance> findAllByOrderByCreatedAtDesc();

    // --- Branch-scoped ---
    List<StaffAdvance> findByBranchIdOrderByCreatedAtDesc(Long branchId);
}

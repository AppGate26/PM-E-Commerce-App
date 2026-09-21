package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.enums.StaffStatusEnum;
import com.appGate.staffpayroll.models.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByStaffId(String staffId);
    Optional<Staff> findByEmail(String email);
    List<Staff> findByStatus(StaffStatusEnum status);
    boolean existsByEmail(String email);
    long countByStatus(StaffStatusEnum status);

    // --- Branch-scoped ---
    List<Staff> findByBranchId(Long branchId);
    List<Staff> findByBranchIdAndStatus(Long branchId, StaffStatusEnum status);
    long countByBranchIdAndStatus(Long branchId, StaffStatusEnum status);
}

package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.SalaryBreakdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SalaryBreakdownRepository extends JpaRepository<SalaryBreakdown, Long> {
    Optional<SalaryBreakdown> findByStaffId(Long staffId);
}

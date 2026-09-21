package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.StaffAdvanceRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface StaffAdvanceRepaymentRepository extends JpaRepository<StaffAdvanceRepayment, Long> {

    List<StaffAdvanceRepayment> findByAdvanceId(Long advanceId);

    List<StaffAdvanceRepayment> findByStaffId(Long staffId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM StaffAdvanceRepayment r WHERE r.advanceId = :advanceId AND r.status IN ('COMPLETED', 'PENDING')")
    BigDecimal getTotalRepaidByAdvanceId(@Param("advanceId") Long advanceId);

    List<StaffAdvanceRepayment> findByAdvanceIdOrderByRepaymentDateAsc(Long advanceId);
}

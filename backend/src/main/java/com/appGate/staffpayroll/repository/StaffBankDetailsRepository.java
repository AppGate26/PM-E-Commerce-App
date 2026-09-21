package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.StaffBankDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StaffBankDetailsRepository extends JpaRepository<StaffBankDetails, Long> {
    Optional<StaffBankDetails> findByStaffId(Long staffId);
}

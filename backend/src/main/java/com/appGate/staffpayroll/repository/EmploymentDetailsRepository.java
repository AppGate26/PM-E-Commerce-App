package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.models.EmploymentDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmploymentDetailsRepository extends JpaRepository<EmploymentDetails, Long> {
    Optional<EmploymentDetails> findByStaffId(Long staffId);
    List<EmploymentDetails> findByDepartment(String department);
}

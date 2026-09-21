package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import com.appGate.staffpayroll.models.SalaryComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, Long> {
    List<SalaryComponent> findBySalaryBreakdownId(Long salaryBreakdownId);
    List<SalaryComponent> findBySalaryBreakdownIdAndComponentType(Long salaryBreakdownId, SalaryComponentType componentType);
    void deleteBySalaryBreakdownId(Long salaryBreakdownId);
}

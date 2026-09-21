package com.appGate.customercare.repository;

import com.appGate.customercare.enums.EscalationStatus;
import com.appGate.customercare.models.Escalation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationRepository extends JpaRepository<Escalation, Long> {

    List<Escalation> findAllByOrderByCreatedAtDesc();

    List<Escalation> findByDepartmentOrderByCreatedAtDesc(String department);

    List<Escalation> findByStatusOrderByCreatedAtDesc(EscalationStatus status);

    List<Escalation> findByDepartmentAndStatusOrderByCreatedAtDesc(String department, EscalationStatus status);

    List<Escalation> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Escalation> findByDepartmentAndBranchIdOrderByCreatedAtDesc(String department, Long branchId);

    List<Escalation> findByStatusAndBranchIdOrderByCreatedAtDesc(EscalationStatus status, Long branchId);

    List<Escalation> findByDepartmentAndStatusAndBranchIdOrderByCreatedAtDesc(
            String department, EscalationStatus status, Long branchId);
}

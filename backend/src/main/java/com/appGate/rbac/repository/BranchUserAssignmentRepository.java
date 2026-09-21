package com.appGate.rbac.repository;

import com.appGate.rbac.models.BranchUserAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchUserAssignmentRepository extends JpaRepository<BranchUserAssignment, Long> {

    Optional<BranchUserAssignment> findByUserId(Long userId);

    Optional<BranchUserAssignment> findByUserEmail(String email);
}

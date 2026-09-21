package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.models.RecoveryAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryAgentRepository extends JpaRepository<RecoveryAgent, Long> {
    Optional<RecoveryAgent> findByEmail(String email);
    List<RecoveryAgent> findBySuspended(Boolean suspended);
    List<RecoveryAgent> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String firstName, String lastName, String email);

    List<RecoveryAgent> findByBranchId(Long branchId);
    List<RecoveryAgent> findBySuspendedAndBranchId(Boolean suspended, Long branchId);
}

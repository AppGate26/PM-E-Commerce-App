package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.models.RecoveryAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecoveryAgentRepository extends JpaRepository<RecoveryAgent, Long> {
    Optional<RecoveryAgent> findByEmail(String email);
}

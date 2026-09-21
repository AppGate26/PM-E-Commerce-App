package com.appGate.recovery.repository;

import com.appGate.recovery.enums.RecoveryStatus;
import com.appGate.recovery.enums.RecoveryType;
import com.appGate.recovery.models.RecoveryRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryRequestRepository extends JpaRepository<RecoveryRequest, Long>, JpaSpecificationExecutor<RecoveryRequest> {

    Optional<RecoveryRequest> findByRecoveryToken(String recoveryToken);

    Optional<RecoveryRequest> findByRecoveryCode(String recoveryCode);

    List<RecoveryRequest> findByUserIdAndStatus(Long userId, RecoveryStatus status);

    List<RecoveryRequest> findByUserIdAndRecoveryType(Long userId, RecoveryType recoveryType);

    Optional<RecoveryRequest> findTopByUserIdAndRecoveryTypeAndStatusOrderByCreatedAtDesc(
            Long userId, RecoveryType recoveryType, RecoveryStatus status);

    List<RecoveryRequest> findByStatusAndTokenExpiresAtBefore(RecoveryStatus status, LocalDateTime expiryTime);

    Long countByUserIdAndRecoveryTypeAndCreatedAtAfter(Long userId, RecoveryType recoveryType, LocalDateTime since);
}

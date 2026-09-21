package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.models.RecoveryNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryNotificationRepository extends JpaRepository<RecoveryNotification, Long> {
    List<RecoveryNotification> findByRecoveryAgentId(Long recoveryAgentId);
    List<RecoveryNotification> findByRecoveryAgentIdOrderByNotificationDateDesc(Long recoveryAgentId);
    List<RecoveryNotification> findByIsRead(Boolean isRead);

    List<RecoveryNotification> findByBranchId(Long branchId);
    List<RecoveryNotification> findByIsReadAndBranchId(Boolean isRead, Long branchId);
}

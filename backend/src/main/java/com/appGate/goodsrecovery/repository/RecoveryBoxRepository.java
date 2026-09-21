package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.enums.RecoveryBoxStatusEnum;
import com.appGate.goodsrecovery.models.RecoveryBox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryBoxRepository extends JpaRepository<RecoveryBox, Long> {
    List<RecoveryBox> findByRecoveryAgentId(Long recoveryAgentId);
    List<RecoveryBox> findByRecoveryAgentIdAndStatus(Long recoveryAgentId, RecoveryBoxStatusEnum status);
    List<RecoveryBox> findByGoodsRecoveryId(Long goodsRecoveryId);
    List<RecoveryBox> findByStatus(RecoveryBoxStatusEnum status);
    List<RecoveryBox> findByCustomerId(Long customerId);

    List<RecoveryBox> findByBranchId(Long branchId);
    List<RecoveryBox> findByStatusAndBranchId(RecoveryBoxStatusEnum status, Long branchId);
}

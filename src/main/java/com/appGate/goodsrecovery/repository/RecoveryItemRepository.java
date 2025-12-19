package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.models.RecoveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryItemRepository extends JpaRepository<RecoveryItem, Long> {
    List<RecoveryItem> findByGoodsRecoveryId(Long goodsRecoveryId);
}

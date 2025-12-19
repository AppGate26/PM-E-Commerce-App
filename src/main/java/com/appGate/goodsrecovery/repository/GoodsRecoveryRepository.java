package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.enums.GoodsRecoveryStatus;
import com.appGate.goodsrecovery.models.GoodsRecovery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoodsRecoveryRepository extends JpaRepository<GoodsRecovery, Long> {
    Optional<GoodsRecovery> findByCustomerId(Long customerId);
    Page<GoodsRecovery> findByStatus(GoodsRecoveryStatus status, Pageable pageable);
    Page<GoodsRecovery> findAll(Pageable pageable);
}

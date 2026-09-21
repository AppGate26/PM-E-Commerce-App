package com.appGate.inventory.repository;

import com.appGate.inventory.models.GoodsSupplied;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsSuppliedRepository extends JpaRepository<GoodsSupplied, Long> {

    List<GoodsSupplied> findBySupplierId(Long supplierId);

    List<GoodsSupplied> findByProductId(Long productId);

    // --- Branch-scoped ---
    List<GoodsSupplied> findByBranchId(Long branchId);
}

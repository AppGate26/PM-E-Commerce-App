package com.appGate.inventory.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.appGate.inventory.models.Stock;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    // Legacy: single stock per product (used where branchId not yet set)
    Optional<Stock> findByProductId(Long productId);

    // Central stock: branchId is null
    Optional<Stock> findByProductIdAndBranchIdIsNull(Long productId);

    // Branch stock: specific product at a specific branch
    Optional<Stock> findByProductIdAndBranchId(Long productId, Long branchId);

    // Same lookup as findByProductIdAndBranchId, but takes a row lock so the check-then-decrement
    // in OrderService.checkout can't race with a concurrent checkout on the same product/branch
    // and oversell stock. Must be called inside an existing transaction.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.product.id = :productId AND s.branchId = :branchId")
    Optional<Stock> findByProductIdAndBranchIdForUpdate(@Param("productId") Long productId, @Param("branchId") Long branchId);

    // Same lock as findByProductIdAndBranchIdForUpdate, for the central (branchId IS NULL)
    // pool a checkout falls back to when the chosen branch has no stock row of its own.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.product.id = :productId AND s.branchId IS NULL")
    Optional<Stock> findByProductIdAndBranchIdIsNullForUpdate(@Param("productId") Long productId);

    // All stock entries for a branch
    List<Stock> findByBranchId(Long branchId);

    // All central stock entries
    List<Stock> findByBranchIdIsNull();

    List<Stock> findByQuantityLessThanEqual(Integer threshold);

    List<Stock> findByIsOpeningStockTrue();

    List<Stock> findByIsOpeningStockTrueAndBranchId(Long branchId);

    List<Stock> findBySupplierId(Long supplierId);

    @Query("SELECT s FROM Stock s WHERE s.quantity <= s.reorderLevel")
    List<Stock> findLowStockItems();

    @Query("SELECT s FROM Stock s WHERE s.quantity <= s.reorderLevel AND s.branchId = :branchId")
    List<Stock> findLowStockItemsByBranch(Long branchId);
}

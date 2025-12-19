package com.appGate.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.appGate.inventory.models.Stock;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProductId(Long productId);

    List<Stock> findByQuantityLessThanEqual(Integer threshold);

    // Find low stock items (quantity <= reorder level)
    // List<Stock> findByQuantityLessThanEqualReorderLevel();

    @Query("SELECT s FROM Stock s WHERE s.quantity <= s.reorderLevel")
    List<Stock> findLowStockItems();

}

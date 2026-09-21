package com.appGate.warehouse.repository;

import com.appGate.warehouse.models.WarehouseProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseProductRepository extends JpaRepository<WarehouseProduct, Long> {
    Optional<WarehouseProduct> findByWarehouseIdAndProductId(Long warehouseId, Long productId);
    List<WarehouseProduct> findByWarehouseId(Long warehouseId);
}

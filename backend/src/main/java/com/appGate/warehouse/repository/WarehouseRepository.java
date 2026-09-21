package com.appGate.warehouse.repository;

import com.appGate.warehouse.enums.WarehouseStatus;
import com.appGate.warehouse.models.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByStatus(WarehouseStatus status);
    List<Warehouse> findByBranchId(Long branchId);
}

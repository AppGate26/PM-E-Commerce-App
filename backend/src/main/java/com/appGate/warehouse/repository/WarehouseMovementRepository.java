package com.appGate.warehouse.repository;

import com.appGate.warehouse.enums.ApprovalStatus;
import com.appGate.warehouse.enums.MovementType;
import com.appGate.warehouse.models.WarehouseMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseMovementRepository extends JpaRepository<WarehouseMovement, Long> {
    List<WarehouseMovement> findByWarehouseId(Long warehouseId);
    List<WarehouseMovement> findByMovementType(MovementType movementType);
    List<WarehouseMovement> findByApprovalStatus(ApprovalStatus status);
    Optional<WarehouseMovement> findByReferenceNo(String referenceNo);
    List<WarehouseMovement> findByWarehouseIdAndMovementType(Long warehouseId, MovementType movementType);
}

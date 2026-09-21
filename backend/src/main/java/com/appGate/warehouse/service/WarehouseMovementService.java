package com.appGate.warehouse.service;

import com.appGate.warehouse.dto.*;
import com.appGate.warehouse.enums.ApprovalStatus;
import com.appGate.warehouse.enums.MovementType;
import com.appGate.warehouse.models.WarehouseMovement;
import com.appGate.warehouse.models.WarehouseProduct;
import com.appGate.warehouse.repository.WarehouseMovementRepository;
import com.appGate.warehouse.repository.WarehouseProductRepository;
import com.appGate.warehouse.repository.WarehouseRepository;
import com.appGate.warehouse.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@AllArgsConstructor
public class WarehouseMovementService {

    private final WarehouseMovementRepository movementRepository;
    private final WarehouseProductRepository warehouseProductRepository;
    private final WarehouseRepository warehouseRepository;
    private final BranchScopeService branchScopeService;

    // A branch user only ever sees their own branch's movements; head office / admins
    // (scoped branch id == null) see everything unfiltered.
    private List<WarehouseMovement> scopeToBranch(List<WarehouseMovement> movements) {
        Long branchId = branchScopeService.getScopedBranchId();
        if (branchId == null) {
            return movements;
        }
        return movements.stream()
                .filter(m -> Objects.equals(m.getBranchId(), branchId))
                .toList();
    }

    private String generateRef(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // Movements are recorded as PENDING and only take effect on the warehouse's on-hand
    // quantities once an admin approves them (see WarehouseService.approveMovement) — so a
    // rejected movement leaves inventory untouched instead of having already applied.
    @Transactional
    public BaseResponse addProductToWarehouse(ProductReceiptDto dto) {
        try {
            warehouseRepository.findById(dto.getWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Warehouse not found"));

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WPR"));
            movement.setWarehouseId(dto.getWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.PRODUCT_RECEIPT);
            movement.setQuantityIn(dto.getQuantityReceived());
            movement.setQuantityOut(0);
            movement.setSourceType(dto.getSourceType());
            movement.setReceivedDate(dto.getReceivedDate());
            movement.setReceivedBy(dto.getReceivedBy());
            movement.setCostPrice(dto.getCostPrice());
            movement.setCondition(dto.getCondition());
            movement.setSupplierId(dto.getSupplierId());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Product receipt recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse allocateToStock(StockAllocationFromWarehouseDto dto) {
        try {
            WarehouseProduct warehouseProduct = warehouseProductRepository
                    .findByWarehouseIdAndProductId(dto.getWarehouseId(), dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found in warehouse"));

            if (warehouseProduct.getQuantityOnHand() < dto.getQuantity()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Insufficient warehouse stock. Available: " + warehouseProduct.getQuantityOnHand(), null);
            }

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WSA"));
            movement.setWarehouseId(dto.getWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.STOCK_ALLOCATION);
            movement.setQuantityIn(0);
            movement.setQuantityOut(dto.getQuantity());
            movement.setBranchId(dto.getBranchId());
            movement.setUnitPrice(dto.getUnitPrice());
            movement.setStockIncrement(dto.getStockIncrement());
            movement.setAccountToDebit(dto.getAccountToDebit());
            movement.setAccountToCredit(dto.getAccountToCredit());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Stock allocation recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse transferBetweenWarehouses(WarehouseTransferDto dto) {
        try {
            warehouseRepository.findById(dto.getSenderWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Sender warehouse not found"));
            warehouseRepository.findById(dto.getReceiverWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Receiver warehouse not found"));

            WarehouseProduct senderProduct = warehouseProductRepository
                    .findByWarehouseIdAndProductId(dto.getSenderWarehouseId(), dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found in sender warehouse"));

            if (senderProduct.getQuantityOnHand() < dto.getQuantity()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Insufficient stock in sender warehouse. Available: " + senderProduct.getQuantityOnHand(), null);
            }

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WTR"));
            movement.setWarehouseId(dto.getSenderWarehouseId());
            movement.setReceiverWarehouseId(dto.getReceiverWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.TRANSFER);
            movement.setQuantityIn(0);
            movement.setQuantityOut(dto.getQuantity());
            movement.setStockDecrease(dto.getQuantity());
            movement.setStockIncrement(dto.getQuantity());
            movement.setAccountToDebit(dto.getAccountToDebit());
            movement.setAccountToCredit(dto.getAccountToCredit());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Transfer recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse swapProduct(ProductSwapDto dto) {
        try {
            WarehouseProduct senderProduct = warehouseProductRepository
                    .findByWarehouseIdAndProductId(dto.getSenderWarehouseId(), dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found in sender warehouse"));

            if (senderProduct.getQuantityOnHand() < dto.getQuantity()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Insufficient stock. Available: " + senderProduct.getQuantityOnHand(), null);
            }

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WSW"));
            movement.setWarehouseId(dto.getSenderWarehouseId());
            movement.setReceiverWarehouseId(dto.getReceiverWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.SWAP);
            movement.setQuantityOut(dto.getQuantity());
            movement.setBranchId(dto.getBranchId());
            movement.setUnitPrice(dto.getUnitPrice());
            movement.setStockDecrease(dto.getQuantity());
            movement.setStockIncrement(dto.getQuantity());
            movement.setAccountToDebit(dto.getAccountToDebit());
            movement.setAccountToCredit(dto.getAccountToCredit());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Product swap recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse quarantineIn(QuarantineProductDto dto) {
        try {
            WarehouseProduct warehouseProduct = warehouseProductRepository
                    .findByWarehouseIdAndProductId(dto.getWarehouseId(), dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found in warehouse"));

            if (warehouseProduct.getQuantityOnHand() < dto.getQuantity()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Insufficient stock for quarantine. Available: " + warehouseProduct.getQuantityOnHand(), null);
            }

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WQI"));
            movement.setWarehouseId(dto.getWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.QUARANTINE_IN);
            movement.setQuantityOut(dto.getQuantity());
            movement.setBranchId(dto.getBranchId());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Quarantine IN recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse quarantineOut(QuarantineProductDto dto) {
        try {
            warehouseRepository.findById(dto.getReceiverWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Receiver warehouse not found"));

            WarehouseMovement movement = new WarehouseMovement();
            movement.setReferenceNo(generateRef("WQO"));
            movement.setWarehouseId(dto.getWarehouseId());
            movement.setReceiverWarehouseId(dto.getReceiverWarehouseId());
            movement.setProductId(dto.getProductId());
            movement.setMovementType(MovementType.QUARANTINE_OUT);
            movement.setQuantityIn(dto.getQuantity());
            movement.setBranchId(dto.getBranchId());
            movement.setApprovalStatus(ApprovalStatus.PENDING);

            return new BaseResponse(HttpStatus.CREATED.value(), "Quarantine OUT recorded, awaiting approval",
                    movementRepository.save(movement));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getMovementsByWarehouse(Long warehouseId) {
        return new BaseResponse(HttpStatus.OK.value(), "Movements retrieved",
                scopeToBranch(movementRepository.findByWarehouseId(warehouseId)));
    }

    public BaseResponse getMovementsByType(MovementType type) {
        return new BaseResponse(HttpStatus.OK.value(), "Movements retrieved",
                scopeToBranch(movementRepository.findByMovementType(type)));
    }

    public BaseResponse getReport(Long warehouseId, LocalDate from, LocalDate to) {
        List<WarehouseMovement> movements = movementRepository.findByWarehouseId(warehouseId);
        if (from != null && to != null) {
            movements = movements.stream()
                    .filter(m -> m.getCreatedAt() != null
                            && !m.getCreatedAt().toLocalDate().isBefore(from)
                            && !m.getCreatedAt().toLocalDate().isAfter(to))
                    .toList();
        }
        return new BaseResponse(HttpStatus.OK.value(), "Report generated", scopeToBranch(movements));
    }
}

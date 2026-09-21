package com.appGate.warehouse.service;

import com.appGate.warehouse.dto.AttachManagerDto;
import com.appGate.warehouse.dto.CreateWarehouseDto;
import com.appGate.warehouse.dto.ProductToWarehouseRequestDto;
import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.JournalLineDto;
import com.appGate.account.enums.JournalType;
import com.appGate.account.models.Account;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.service.JournalEntryService;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.warehouse.enums.ApprovalStatus;
import com.appGate.warehouse.enums.MovementType;
import com.appGate.warehouse.enums.WarehouseStatus;
import com.appGate.warehouse.models.Warehouse;
import com.appGate.warehouse.models.WarehouseMovement;
import com.appGate.warehouse.models.WarehouseProduct;
import com.appGate.warehouse.repository.WarehouseMovementRepository;
import com.appGate.warehouse.repository.WarehouseProductRepository;
import com.appGate.warehouse.repository.WarehouseRepository;
import com.appGate.warehouse.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import com.appGate.rbac.repository.ApprovalRequestRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@AllArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseMovementRepository movementRepository;
    private final WarehouseProductRepository warehouseProductRepository;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final JournalEntryService journalEntryService;
    private final AccountRepository accountRepository;
    private final BranchScopeService branchScopeService;
    private final ApprovalRequestRepository approvalRequestRepository;

    // A branch user only sees warehouses belonging to their own branch; head office /
    // admins (scoped branch id == null) see every warehouse.
    private List<Warehouse> scopeWarehouses(List<Warehouse> warehouses) {
        Long branchId = branchScopeService.getScopedBranchId();
        if (branchId == null) {
            return warehouses;
        }
        return warehouses.stream()
                .filter(w -> Objects.equals(w.getBranchId(), branchId))
                .toList();
    }

    /** Load a warehouse, refusing one that belongs to another branch. */
    private Warehouse loadWarehouseInScope(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        branchScopeService.assertCanAccess(warehouse.getBranchId());
        return warehouse;
    }

    @Transactional
    public BaseResponse createWarehouse(CreateWarehouseDto dto) {
        try {
            Warehouse warehouse = new Warehouse();
            warehouse.setWarehouseName(dto.getWarehouseName());
            warehouse.setBranchCode(dto.getBranchCode());
            warehouse.setLocationAddress(dto.getLocationAddress());
            warehouse.setStateCity(dto.getStateCity());
            warehouse.setBranchManagerId(dto.getBranchManagerId());
            warehouse.setPhoneNumber(dto.getPhoneNumber());
            warehouse.setEmail(dto.getEmail());
            warehouse.setStorageCapacity(dto.getStorageCapacity());
            // A branch user can only stand up a warehouse in their own branch.
            warehouse.setBranchId(branchScopeService.resolveWriteBranchId(dto.getBranchId()));
            warehouse.setStatus(WarehouseStatus.ACTIVE);
            return new BaseResponse(HttpStatus.CREATED.value(), "Warehouse created successfully", warehouseRepository.save(warehouse));
        } catch (AccessDeniedException e) {
            throw e; // a branch violation is a 403, not a 500
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getAllWarehouses() {
        return new BaseResponse(HttpStatus.OK.value(), "Warehouses retrieved", scopeWarehouses(warehouseRepository.findAll()));
    }

    public BaseResponse getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id).orElse(null);
        if (warehouse == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Warehouse not found", null);
        }
        branchScopeService.assertCanAccess(warehouse.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Warehouse found", warehouse);
    }

    @Transactional
    public BaseResponse toggleStatus(Long id) {
        try {
            Warehouse warehouse = loadWarehouseInScope(id);
            warehouse.setStatus(warehouse.getStatus() == WarehouseStatus.ACTIVE
                    ? WarehouseStatus.INACTIVE : WarehouseStatus.ACTIVE);
            return new BaseResponse(HttpStatus.OK.value(), "Warehouse status updated", warehouseRepository.save(warehouse));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse attachManager(Long warehouseId, AttachManagerDto dto) {
        try {
            Warehouse warehouse = loadWarehouseInScope(warehouseId);
            warehouse.setBranchManagerId(dto.getManagerId());
            return new BaseResponse(HttpStatus.OK.value(), "Manager attached successfully", warehouseRepository.save(warehouse));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getStockBalanceAllWarehouses() {
        List<Warehouse> warehouses = scopeWarehouses(warehouseRepository.findAll());
        Map<String, Object> result = new HashMap<>();
        for (Warehouse w : warehouses) {
            List<WarehouseProduct> products = warehouseProductRepository.findByWarehouseId(w.getId());
            result.put(w.getWarehouseName() + " (" + w.getId() + ")", products);
        }
        return new BaseResponse(HttpStatus.OK.value(), "Stock balance across all warehouses", result);
    }

    // Products currently held in a single warehouse — used by the outbound workflow product
    // pickers (warehouse-to-stock, transfer, swap, quarantine) so a user can only pick a
    // product that was actually received into the selected warehouse.
    public BaseResponse getStockBalanceForWarehouse(Long warehouseId) {
        // The warehouse id comes off the URL, so check the caller owns that warehouse
        // before handing back its contents.
        loadWarehouseInScope(warehouseId);
        List<WarehouseProduct> products = warehouseProductRepository.findByWarehouseId(warehouseId);
        return new BaseResponse(HttpStatus.OK.value(), "Stock balance for warehouse " + warehouseId, products);
    }

    @Transactional
    public BaseResponse approveMovement(Long movementId, Long approvedBy) {
        try {
            WarehouseMovement movement = movementRepository.findById(movementId)
                    .orElseThrow(() -> new RuntimeException("Movement not found"));
            branchScopeService.assertCanAccess(movement.getBranchId());
            if (movement.getApprovalStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Movement is not in PENDING state", null);
            }

            // The movement's quantities were only recorded, not applied, when it was
            // submitted — applying them here (and re-checking availability, since stock may
            // have moved since submission) is what makes approval actually gate the effect.
            BaseResponse insufficientStock = applyMovementToWarehouseProducts(movement);
            if (insufficientStock != null) {
                return insufficientStock;
            }

            movement.setApprovalStatus(ApprovalStatus.APPROVED);
            movement.setApprovedBy(approvedBy);
            movement.setApprovedAt(LocalDateTime.now());

            // Approving a warehouse-to-stock allocation pushes the product into the
            // branch's inventory stock (carrying the selling price) so it becomes sellable.
            if (movement.getMovementType() == MovementType.STOCK_ALLOCATION) {
                applyStockAllocationToInventory(movement);
                postStockAllocationJournal(movement, approvedBy);
            }

            return new BaseResponse(HttpStatus.OK.value(), "Movement approved", movementRepository.save(movement));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    // Applies an approved movement's quantity delta(s) to the relevant WarehouseProduct
    // row(s) and stamps balanceAfter. Returns a BAD_REQUEST BaseResponse (leaving the
    // movement PENDING) if the source warehouse no longer holds enough stock to cover it;
    // returns null on success.
    private BaseResponse applyMovementToWarehouseProducts(WarehouseMovement movement) {
        Integer qtyIn = movement.getQuantityIn();
        Integer qtyOut = movement.getQuantityOut();
        switch (movement.getMovementType()) {
            case PRODUCT_RECEIPT -> movement.setBalanceAfter(
                    adjustWarehouseProduct(movement.getWarehouseId(), movement.getProductId(),
                            qtyIn != null ? qtyIn : 0));
            case STOCK_ALLOCATION, QUARANTINE_IN -> {
                int qty = qtyOut != null ? qtyOut : 0;
                BaseResponse insufficient = checkSufficientStock(movement.getWarehouseId(), movement.getProductId(), qty);
                if (insufficient != null) {
                    return insufficient;
                }
                movement.setBalanceAfter(
                        adjustWarehouseProduct(movement.getWarehouseId(), movement.getProductId(), -qty));
            }
            case TRANSFER, SWAP -> {
                int qty = qtyOut != null ? qtyOut : 0;
                BaseResponse insufficient = checkSufficientStock(movement.getWarehouseId(), movement.getProductId(), qty);
                if (insufficient != null) {
                    return insufficient;
                }
                movement.setBalanceAfter(
                        adjustWarehouseProduct(movement.getWarehouseId(), movement.getProductId(), -qty));
                adjustWarehouseProduct(movement.getReceiverWarehouseId(), movement.getProductId(), qty);
            }
            case QUARANTINE_OUT -> movement.setBalanceAfter(
                    adjustWarehouseProduct(movement.getReceiverWarehouseId(), movement.getProductId(),
                            qtyIn != null ? qtyIn : 0));
        }
        return null;
    }

    private BaseResponse checkSufficientStock(Long warehouseId, Long productId, int quantity) {
        WarehouseProduct product = warehouseProductRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElse(null);
        int available = product != null && product.getQuantityOnHand() != null ? product.getQuantityOnHand() : 0;
        if (available < quantity) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                    "Insufficient warehouse stock at approval time. Available: " + available, null);
        }
        return null;
    }

    // Adjusts (creating the row if absent) a warehouse's on-hand quantity for a product by
    // delta (positive to add, negative to remove) and returns the resulting balance.
    private int adjustWarehouseProduct(Long warehouseId, Long productId, int delta) {
        WarehouseProduct product = warehouseProductRepository
                .findByWarehouseIdAndProductId(warehouseId, productId)
                .orElseGet(() -> {
                    WarehouseProduct created = new WarehouseProduct();
                    created.setWarehouseId(warehouseId);
                    created.setProductId(productId);
                    created.setQuantityOnHand(0);
                    return created;
                });
        int newBalance = (product.getQuantityOnHand() != null ? product.getQuantityOnHand() : 0) + delta;
        product.setQuantityOnHand(newBalance);
        warehouseProductRepository.save(product);
        return newBalance;
    }

    @Transactional
    public BaseResponse rejectMovement(Long movementId, Long approvedBy, String reason) {
        try {
            WarehouseMovement movement = movementRepository.findById(movementId)
                    .orElseThrow(() -> new RuntimeException("Movement not found"));
            branchScopeService.assertCanAccess(movement.getBranchId());
            if (movement.getApprovalStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Movement is not in PENDING state", null);
            }
            movement.setApprovalStatus(ApprovalStatus.REJECTED);
            movement.setApprovedBy(approvedBy);
            movement.setApprovedAt(LocalDateTime.now());
            movement.setNotes(reason);
            return new BaseResponse(HttpStatus.OK.value(), "Movement rejected", movementRepository.save(movement));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getPendingMovements() {
        return new BaseResponse(HttpStatus.OK.value(), "Pending movements",
                movementRepository.findByApprovalStatus(ApprovalStatus.PENDING));
    }

    // Creates or increments the inventory Stock row for an approved stock allocation so
    // the allocated product (with its selling price) is available to the sales screens.
    private void applyStockAllocationToInventory(WarehouseMovement movement) {
        Long productId = movement.getProductId();
        Long branchId = movement.getBranchId();
        int quantity = movement.getQuantityOut() != null ? movement.getQuantityOut() : 0;
        if (productId == null || quantity <= 0) {
            return;
        }

        Optional<Stock> existing = branchId != null
                ? stockRepository.findByProductIdAndBranchId(productId, branchId)
                : stockRepository.findByProductIdAndBranchIdIsNull(productId);

        Stock stock = existing.orElseGet(() -> {
            Stock created = new Stock();
            Product product = productRepository.findById(productId).orElse(null);
            created.setProduct(product);
            created.setBranchId(branchId);
            created.setQuantity(0);
            created.setReorderLevel(0);
            created.setStockDate(LocalDate.now());
            return created;
        });

        int currentQty = stock.getQuantity() != null ? stock.getQuantity() : 0;
        stock.setQuantity(currentQty + quantity);

        if (movement.getUnitPrice() != null) {
            stock.setUnitPrice(movement.getUnitPrice().toPlainString());
        }
        if (movement.getAccountToCredit() != null) {
            stock.setAccountToCredit(movement.getAccountToCredit());
        }
        if (movement.getAccountToDebit() != null) {
            stock.setAccountToDebit(movement.getAccountToDebit());
        }
        if (movement.getSupplierId() != null) {
            stock.setSupplierId(movement.getSupplierId());
        }

        stockRepository.save(stock);
    }

    // Posts a balanced GL journal for an approved stock allocation: debits the
    // "account to debit" (e.g. inventory) and credits the "account to credit" for the
    // allocation value (unit price x quantity). The movement stores GL *codes*, which we
    // resolve to accounts. If either code is unknown or the value is zero, we skip posting
    // rather than fail the approval.
    private void postStockAllocationJournal(WarehouseMovement movement, Long approvedBy) {
        String debitCode = movement.getAccountToDebit();
        String creditCode = movement.getAccountToCredit();
        int quantity = movement.getQuantityOut() != null ? movement.getQuantityOut() : 0;
        if (debitCode == null || creditCode == null || movement.getUnitPrice() == null || quantity <= 0) {
            return;
        }

        BigDecimal amount = movement.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Account debitAccount = accountRepository.findByGlCode(debitCode).orElse(null);
        Account creditAccount = accountRepository.findByGlCode(creditCode).orElse(null);
        if (debitAccount == null || creditAccount == null) {
            return;
        }

        String description = "Warehouse stock allocation " + movement.getReferenceNo();

        JournalLineDto debitLine = new JournalLineDto();
        debitLine.setAccountId(debitAccount.getId());
        debitLine.setDescription(description);
        debitLine.setDebit(amount);
        debitLine.setCredit(null);
        debitLine.setReferenceNo(movement.getReferenceNo());

        JournalLineDto creditLine = new JournalLineDto();
        creditLine.setAccountId(creditAccount.getId());
        creditLine.setDescription(description);
        creditLine.setDebit(null);
        creditLine.setCredit(amount);
        creditLine.setReferenceNo(movement.getReferenceNo());

        CreateJournalEntryDto journalDto = new CreateJournalEntryDto();
        journalDto.setJournalType(JournalType.GENERAL_JOURNAL);
        journalDto.setTransactionDate(LocalDate.now());
        journalDto.setDescription(description);
        journalDto.setJournalLines(List.of(debitLine, creditLine));

        journalEntryService.createJournalEntry(journalDto, approvedBy);
    }

    @Transactional
    public BaseResponse requestProductToWarehouseMovement(ProductToWarehouseRequestDto dto) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

            // Verify product exists
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            // Verify destination warehouse exists
            Warehouse destWarehouse = warehouseRepository.findById(dto.getDestinationWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Destination warehouse not found"));

            // For transfers, verify source warehouse exists
            if (dto.getSourceWarehouseId() != null) {
                Warehouse sourceWarehouse = warehouseRepository.findById(dto.getSourceWarehouseId())
                        .orElseThrow(() -> new RuntimeException("Source warehouse not found"));
            }

            // Create approval request for product-to-warehouse movement
            com.appGate.rbac.models.ApprovalRequest approval = new com.appGate.rbac.models.ApprovalRequest();
            approval.setApprovalType(com.appGate.rbac.enums.ApprovalType.PRODUCT_TO_WAREHOUSE);
            approval.setEntityId(dto.getProductId());
            approval.setRequestedBy(dto.getRequestedBy() != null ? dto.getRequestedBy() : 0L);
            approval.setStatus(com.appGate.rbac.enums.ApprovalStatus.PENDING);

            // Store movement details in requestData as JSON
            java.util.Map<String, Object> movementData = new java.util.HashMap<>();
            movementData.put("productId", dto.getProductId());
            movementData.put("productName", product.getProductName());
            movementData.put("destinationWarehouseId", dto.getDestinationWarehouseId());
            movementData.put("destinationWarehouse", destWarehouse.getWarehouseName());
            movementData.put("sourceWarehouseId", dto.getSourceWarehouseId());
            movementData.put("quantity", dto.getQuantity());
            movementData.put("operationType", dto.getOperationType());
            movementData.put("reason", dto.getReason());
            movementData.put("referenceNumber", dto.getReferenceNumber());
            movementData.put("unitPrice", dto.getUnitPrice());
            movementData.put("notes", dto.getNotes());

            approval.setRequestData(mapper.writeValueAsString(movementData));
            approval.setComments("Product to warehouse movement submitted for admin approval");

            com.appGate.rbac.models.ApprovalRequest savedApproval =
                    approvalRequestRepository.save(approval);

            return new BaseResponse(HttpStatus.CREATED.value(),
                    "Product to warehouse movement submitted for approval", savedApproval);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error submitting product movement for approval: " + e.getMessage(), null);
        }
    }
}

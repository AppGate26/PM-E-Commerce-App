package com.appGate.warehouse.controller;

import com.appGate.warehouse.dto.AttachManagerDto;
import com.appGate.warehouse.dto.CreateWarehouseDto;
import com.appGate.warehouse.response.BaseResponse;
import com.appGate.warehouse.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@Tag(name = "Warehouse - Super Admin", description = "Warehouse management for SUPER_ADMIN")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @Operation(summary = "Create warehouse", description = "SUPER_ADMIN creates a warehouse for a branch or head office")
    @PostMapping("/api/admin/warehouses")
    public BaseResponse createWarehouse(@RequestBody CreateWarehouseDto dto) {
        return warehouseService.createWarehouse(dto);
    }

    @Operation(summary = "Get all warehouses")
    @GetMapping("/api/admin/warehouses")
    public BaseResponse getAllWarehouses() {
        return warehouseService.getAllWarehouses();
    }

    @Operation(summary = "Get warehouse by ID")
    @GetMapping("/api/admin/warehouses/{id}")
    public BaseResponse getWarehouseById(@PathVariable Long id) {
        return warehouseService.getWarehouseById(id);
    }

    @Operation(summary = "Activate or deactivate warehouse")
    @PatchMapping("/api/admin/warehouses/{id}/toggle-status")
    public BaseResponse toggleStatus(@PathVariable Long id) {
        return warehouseService.toggleStatus(id);
    }

    @Operation(summary = "Attach warehouse manager")
    @PatchMapping("/api/admin/warehouses/{id}/attach-manager")
    public BaseResponse attachManager(@PathVariable Long id, @RequestBody AttachManagerDto dto) {
        return warehouseService.attachManager(id, dto);
    }

    @Operation(summary = "View stock balance across all warehouses")
    @GetMapping("/api/admin/warehouses/stock-balance")
    public BaseResponse getStockBalanceAllWarehouses() {
        return warehouseService.getStockBalanceAllWarehouses();
    }

    @Operation(summary = "View stock balance (products on hand) for a single warehouse")
    @GetMapping("/api/admin/warehouses/{warehouseId}/stock-balance")
    public BaseResponse getStockBalanceForWarehouse(@PathVariable Long warehouseId) {
        return warehouseService.getStockBalanceForWarehouse(warehouseId);
    }

    @Operation(summary = "Get pending movements for approval")
    @GetMapping("/api/admin/warehouses/movements/pending")
    public BaseResponse getPendingMovements() {
        return warehouseService.getPendingMovements();
    }

    @Operation(summary = "Approve a warehouse movement")
    @PatchMapping("/api/admin/warehouses/movements/{movementId}/approve")
    public BaseResponse approveMovement(@PathVariable Long movementId,
                                        @RequestParam Long approvedBy) {
        return warehouseService.approveMovement(movementId, approvedBy);
    }

    @Operation(summary = "Reject a warehouse movement")
    @PatchMapping("/api/admin/warehouses/movements/{movementId}/reject")
    public BaseResponse rejectMovement(@PathVariable Long movementId,
                                       @RequestParam Long approvedBy,
                                       @RequestParam String reason) {
        return warehouseService.rejectMovement(movementId, approvedBy, reason);
    }

    @Operation(summary = "Request product to warehouse movement approval")
    @PostMapping("/api/admin/warehouses/request-product-movement")
    public BaseResponse requestProductToWarehouseMovement(@RequestBody com.appGate.warehouse.dto.ProductToWarehouseRequestDto dto) {
        return warehouseService.requestProductToWarehouseMovement(dto);
    }
}

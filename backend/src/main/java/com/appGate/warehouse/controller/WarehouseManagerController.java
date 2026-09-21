package com.appGate.warehouse.controller;

import com.appGate.warehouse.dto.*;
import com.appGate.warehouse.enums.MovementType;
import com.appGate.warehouse.response.BaseResponse;
import com.appGate.warehouse.service.WarehouseMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@AllArgsConstructor
@Tag(name = "Warehouse - Manager", description = "Warehouse operations for WAREHOUSE_MANAGER")
public class WarehouseManagerController {

    private final WarehouseMovementService movementService;

    @Operation(summary = "Receive product into warehouse", description = "Record incoming product from supplier or other source")
    @PostMapping("/api/users/warehouses/product-receipt")
    public BaseResponse addProductToWarehouse(@RequestBody ProductReceiptDto dto) {
        return movementService.addProductToWarehouse(dto);
    }

    @Operation(summary = "Allocate warehouse stock to branch", description = "Move product from warehouse into a branch's inventory stock")
    @PostMapping("/api/users/warehouses/stock-allocation")
    public BaseResponse allocateToStock(@RequestBody StockAllocationFromWarehouseDto dto) {
        return movementService.allocateToStock(dto);
    }

    @Operation(summary = "Transfer product between warehouses")
    @PostMapping("/api/users/warehouses/transfer")
    public BaseResponse transfer(@RequestBody WarehouseTransferDto dto) {
        return movementService.transferBetweenWarehouses(dto);
    }

    @Operation(summary = "Swap product between warehouses")
    @PostMapping("/api/users/warehouses/swap")
    public BaseResponse swap(@RequestBody ProductSwapDto dto) {
        return movementService.swapProduct(dto);
    }

    @Operation(summary = "Quarantine product IN", description = "Move product into quarantine from warehouse")
    @PostMapping("/api/users/warehouses/quarantine/in")
    public BaseResponse quarantineIn(@RequestBody QuarantineProductDto dto) {
        return movementService.quarantineIn(dto);
    }

    @Operation(summary = "Quarantine product OUT", description = "Release product from quarantine back to a warehouse")
    @PostMapping("/api/users/warehouses/quarantine/out")
    public BaseResponse quarantineOut(@RequestBody QuarantineProductDto dto) {
        return movementService.quarantineOut(dto);
    }

    @Operation(summary = "Get movements by warehouse")
    @GetMapping("/api/users/warehouses/{warehouseId}/movements")
    public BaseResponse getMovementsByWarehouse(@PathVariable Long warehouseId) {
        return movementService.getMovementsByWarehouse(warehouseId);
    }

    @Operation(summary = "Get warehouse report by date range")
    @GetMapping("/api/users/warehouses/{warehouseId}/report")
    public BaseResponse getReport(
            @PathVariable Long warehouseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return movementService.getReport(warehouseId, from, to);
    }

    @Operation(summary = "Get movements by type")
    @GetMapping("/api/users/warehouses/movements/by-type")
    public BaseResponse getMovementsByType(@RequestParam MovementType type) {
        return movementService.getMovementsByType(type);
    }
}

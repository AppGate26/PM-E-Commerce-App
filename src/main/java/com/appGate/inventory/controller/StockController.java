package com.appGate.inventory.controller;

import com.appGate.inventory.dto.StockDto;
import com.appGate.inventory.dto.UpdateStockDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.StockService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@Tag(name = "Inventory Management - Stock", description = "Products, categories, stock, and suppliers")
public class StockController {

    private final StockService stockService;

    // ==================== OPENING STOCK ENDPOINTS ====================
    // These endpoints are under /api/users as requested

    @Operation(summary = "Create opening stock", description = "Record opening/initial stock when starting inventory tracking")
    @PostMapping("/api/users/opening-stock")
    public BaseResponse createOpeningStock(@Valid @RequestBody StockDto dto) {
        // Mark as opening stock
        dto.setIsOpeningStock(true);
        return stockService.createStock(dto);
    }

    @Operation(summary = "Get opening stock records", description = "Retrieve all opening stock entries")
    @GetMapping("/api/users/opening-stock")
    public BaseResponse getOpeningStocks() {
        return stockService.getOpeningStocks();
    }

    // ==================== REGULAR STOCK ENDPOINTS ====================
    // These endpoints are under /api/admin/stocks

    @Operation(summary = "Create new stock entry", description = "Add new stock entry for a product with quantity, reorder level, and accounting details")
    @PostMapping("/api/admin/stocks")
    public BaseResponse createStock(@Valid @RequestBody StockDto dto) {
        return stockService.createStock(dto);
    }

    @Operation(summary = "Get all stocks", description = "Retrieve all stock entries in the system")
    @GetMapping("/api/admin/stocks")
    public BaseResponse getAllStocks() {
        return stockService.getAllStocks();
    }

    @Operation(summary = "Get stock by ID", description = "Retrieve a specific stock entry by ID")
    @GetMapping("/api/admin/stocks/{id}")
    public BaseResponse getStockById(@PathVariable Long id) {
        return stockService.getStockById(id);
    }

    @Operation(summary = "Get stock by product ID", description = "Retrieve stock information for a specific product")
    @GetMapping("/api/admin/stocks/product/{productId}")
    public BaseResponse getStockByProductId(@PathVariable Long productId) {
        return stockService.getStockByProductId(productId);
    }

    @Operation(summary = "Get low stock items", description = "Retrieve all items where quantity is less than or equal to reorder level")
    @GetMapping("/api/admin/stocks/low-stock")
    public BaseResponse getLowStockItems() {
        return stockService.getLowStockItems();
    }

    @Operation(summary = "Update stock", description = "Update stock details including quantity, reorder level, and pricing")
    @PutMapping("/api/admin/stocks/{id}")
    public BaseResponse updateStock(@PathVariable Long id, @Valid @RequestBody UpdateStockDto dto) {
        return stockService.updateStock(id, dto);
    }

    @Operation(summary = "Adjust stock quantity", description = "Increase or decrease stock quantity. Use positive number to add, negative to reduce")
    @PatchMapping("/api/admin/stocks/{id}/adjust")
    public BaseResponse adjustStockQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        return stockService.adjustStockQuantity(id, quantity);
    }

    @Operation(summary = "Delete stock", description = "Remove a stock entry from the system")
    @DeleteMapping("/api/admin/stocks/{id}")
    public BaseResponse deleteStock(@PathVariable Long id) {
        return stockService.deleteStock(id);
    }
}

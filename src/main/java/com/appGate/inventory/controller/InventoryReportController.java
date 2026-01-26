package com.appGate.inventory.controller;

import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.InventoryReportService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Reports", description = "Inventory reports and analytics")
public class InventoryReportController {

    private final InventoryReportService inventoryReportService;

    @Operation(summary = "Get inventory overview", description = "Get comprehensive inventory management report including stock levels, products, suppliers")
    @GetMapping("/report")
    public BaseResponse getInventoryReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getInventoryOverview(startDate, endDate);
    }

    @Operation(summary = "Get stock summary", description = "Get stock summary by category, low stock alerts, and stock value")
    @GetMapping("/stock-summary")
    public BaseResponse getStockSummary() {
        return inventoryReportService.getStockSummary();
    }

    @Operation(summary = "Get low stock alert", description = "Get products with stock below reorder level")
    @GetMapping("/low-stock")
    public BaseResponse getLowStockProducts() {
        return inventoryReportService.getLowStockProducts();
    }

    @Operation(summary = "Get stock movement report", description = "Get stock movement history with date filters")
    @GetMapping("/stock-movement")
    public BaseResponse getStockMovement(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return inventoryReportService.getStockMovementReport(startDate, endDate, page, size);
    }

    @Operation(summary = "Get supplier performance", description = "Get supplier performance report including goods supplied")
    @GetMapping("/supplier-performance")
    public BaseResponse getSupplierPerformance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getSupplierPerformance(startDate, endDate);
    }

    @Operation(summary = "Get product performance", description = "Get best and worst performing products")
    @GetMapping("/product-performance")
    public BaseResponse getProductPerformance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "10") int limit) {
        return inventoryReportService.getProductPerformance(startDate, endDate, limit);
    }

    @Operation(summary = "Get category breakdown", description = "Get inventory breakdown by category and subcategory")
    @GetMapping("/category-breakdown")
    public BaseResponse getCategoryBreakdown() {
        return inventoryReportService.getCategoryBreakdown();
    }

    @Operation(summary = "Get inventory valuation", description = "Get total inventory value and breakdown")
    @GetMapping("/valuation")
    public BaseResponse getInventoryValuation() {
        return inventoryReportService.getInventoryValuation();
    }
}

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

    // ==================== NEW REPORT ENDPOINTS ====================

    @Operation(summary = "Get product report", description = "Get comprehensive product report with stock information")
    @GetMapping("/reports/product")
    public BaseResponse getProductReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getProductReport(startDate, endDate);
    }

    @Operation(summary = "Get product movement report", description = "Get per-product bought, sold, amount sold and balance")
    @GetMapping("/reports/product/movement")
    public BaseResponse getProductMovementReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getProductMovementReport(startDate, endDate);
    }

    @Operation(summary = "Get product by category report", description = "Get products grouped by category with summary statistics")
    @GetMapping("/reports/product/category")
    public BaseResponse getProductByCategoryReport() {
        return inventoryReportService.getProductByCategoryReport();
    }

    @Operation(summary = "Get product by sub-category report", description = "Get products grouped by sub-category with summary statistics")
    @GetMapping("/reports/product/sub-category")
    public BaseResponse getProductBySubCategoryReport() {
        return inventoryReportService.getProductBySubCategoryReport();
    }

    @Operation(summary = "Get suppliers report", description = "Get comprehensive suppliers report with goods supplied and payment terms")
    @GetMapping("/reports/suppliers")
    public BaseResponse getSuppliersReport() {
        return inventoryReportService.getSuppliersReport();
    }

    @Operation(summary = "Get goods supplied report", description = "Get detailed goods supplied transactions report")
    @GetMapping("/reports/goods-supplied")
    public BaseResponse getGoodsSuppliedReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getGoodsSuppliedReport(startDate, endDate);
    }

    @Operation(summary = "Get payment terms report", description = "Get detailed payment terms report")
    @GetMapping("/reports/payment-terms")
    public BaseResponse getPaymentTermsReport() {
        return inventoryReportService.getPaymentTermsReport();
    }

    @Operation(summary = "Get opening stock report", description = "Get opening stock entries report")
    @GetMapping("/reports/opening-stock")
    public BaseResponse getOpeningStockReport() {
        return inventoryReportService.getOpeningStockReport();
    }

    @Operation(summary = "Get stock report", description = "Get comprehensive stock report with status and values")
    @GetMapping("/reports/stock")
    public BaseResponse getStockReport(
            @RequestParam(required = false) String supplierIds,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return inventoryReportService.getStockReport(supplierIds, startDate, endDate);
    }
}

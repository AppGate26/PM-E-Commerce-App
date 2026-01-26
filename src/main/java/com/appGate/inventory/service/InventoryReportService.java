package com.appGate.inventory.service;

import com.appGate.inventory.models.*;
import com.appGate.inventory.repository.*;
import com.appGate.inventory.response.BaseResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryReportService {

    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final GoodsSuppliedRepository goodsSuppliedRepository;

    public BaseResponse getInventoryOverview(String startDate, String endDate) {
        try {
            Map<String, Object> overview = new HashMap<>();

            // Total products
            long totalProducts = productRepository.count();
            overview.put("totalProducts", totalProducts);

            // Total stock items
            long totalStockItems = stockRepository.count();
            overview.put("totalStockItems", totalStockItems);

            // Total suppliers
            long totalSuppliers = supplierRepository.count();
            overview.put("totalSuppliers", totalSuppliers);

            // Total categories
            long totalCategories = categoryRepository.count();
            overview.put("totalCategories", totalCategories);

            // Low stock products (below reorder level)
            List<Stock> allStocks = stockRepository.findAll();
            long lowStockCount = allStocks.stream()
                    .filter(stock -> stock.getQuantity() <= stock.getReorderLevel())
                    .count();
            overview.put("lowStockCount", lowStockCount);

            // Out of stock products
            long outOfStockCount = allStocks.stream()
                    .filter(stock -> stock.getQuantity() == 0)
                    .count();
            overview.put("outOfStockCount", outOfStockCount);

            // Total inventory value
            double totalInventoryValue = allStocks.stream()
                    .mapToDouble(stock -> {
                        try {
                            return stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .sum();
            overview.put("totalInventoryValue", totalInventoryValue);

            // Stock by category
            Map<String, Long> stockByCategory = allStocks.stream()
                    .filter(stock -> stock.getCategory() != null)
                    .collect(Collectors.groupingBy(
                            stock -> stock.getCategory().getName(),
                            Collectors.counting()
                    ));
            overview.put("stockByCategory", stockByCategory);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Inventory overview retrieved successfully", overview);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving inventory overview: " + e.getMessage(), null);
        }
    }

    public BaseResponse getStockSummary() {
        try {
            List<Stock> allStocks = stockRepository.findAll();

            Map<String, Object> summary = new HashMap<>();

            // Total stock quantity
            int totalQuantity = allStocks.stream()
                    .mapToInt(Stock::getQuantity)
                    .sum();
            summary.put("totalQuantity", totalQuantity);

            // Total stock value
            double totalValue = allStocks.stream()
                    .mapToDouble(stock -> {
                        try {
                            return stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .sum();
            summary.put("totalValue", totalValue);

            // Stock by status
            Map<String, Object> stockStatus = new HashMap<>();
            stockStatus.put("inStock", allStocks.stream().filter(s -> s.getQuantity() > s.getReorderLevel()).count());
            stockStatus.put("lowStock", allStocks.stream().filter(s -> s.getQuantity() > 0 && s.getQuantity() <= s.getReorderLevel()).count());
            stockStatus.put("outOfStock", allStocks.stream().filter(s -> s.getQuantity() == 0).count());
            summary.put("stockStatus", stockStatus);

            // Average stock value
            double avgStockValue = allStocks.isEmpty() ? 0 : totalValue / allStocks.size();
            summary.put("averageStockValue", avgStockValue);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Stock summary retrieved successfully", summary);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving stock summary: " + e.getMessage(), null);
        }
    }

    public BaseResponse getLowStockProducts() {
        try {
            List<Stock> allStocks = stockRepository.findAll();

            List<Map<String, Object>> lowStockProducts = allStocks.stream()
                    .filter(stock -> stock.getQuantity() <= stock.getReorderLevel())
                    .map(stock -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("stockId", stock.getId());
                        item.put("productId", stock.getProduct().getId());
                        item.put("productName", stock.getProduct().getProductName());
                        item.put("currentQuantity", stock.getQuantity());
                        item.put("reorderLevel", stock.getReorderLevel());
                        item.put("deficit", stock.getReorderLevel() - stock.getQuantity());
                        item.put("unitPrice", stock.getUnitPrice());
                        item.put("category", stock.getCategory() != null ? stock.getCategory().getName() : null);
                        return item;
                    })
                    .sorted((a, b) -> Integer.compare((int)a.get("currentQuantity"), (int)b.get("currentQuantity")))
                    .collect(Collectors.toList());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Low stock products retrieved successfully", lowStockProducts);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving low stock products: " + e.getMessage(), null);
        }
    }

    public BaseResponse getStockMovementReport(String startDate, String endDate, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("stockDate").descending());

            List<Stock> stocks;

            if (startDate != null && endDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDate start = LocalDate.parse(startDate, formatter);
                LocalDate end = LocalDate.parse(endDate, formatter);

                stocks = stockRepository.findAll().stream()
                        .filter(s -> s.getStockDate() != null)
                        .filter(s -> !s.getStockDate().isBefore(start) && !s.getStockDate().isAfter(end))
                        .collect(Collectors.toList());
            } else {
                stocks = stockRepository.findAll();
            }

            Map<String, Object> result = new HashMap<>();
            result.put("totalRecords", stocks.size());
            result.put("page", page);
            result.put("size", size);
            result.put("movements", stocks);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Stock movement report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving stock movement report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getSupplierPerformance(String startDate, String endDate) {
        try {
            List<Supplier> suppliers = supplierRepository.findAll();
            List<GoodsSupplied> goodsSupplied = goodsSuppliedRepository.findAll();

            List<Map<String, Object>> supplierPerformance = suppliers.stream()
                    .map(supplier -> {
                        Map<String, Object> performance = new HashMap<>();
                        performance.put("supplierId", supplier.getId());
                        performance.put("supplierName", supplier.getCustomerName());
                        performance.put("contactName", supplier.getContactName());
                        performance.put("contactEmail", supplier.getContactEmail());

                        // Count goods supplied by this supplier
                        long suppliedCount = goodsSupplied.stream()
                                .filter(gs -> gs.getSupplierId() != null && gs.getSupplierId().equals(supplier.getId()))
                                .count();
                        performance.put("totalGoodsSupplied", suppliedCount);

                        // Total value supplied
                        double totalValue = goodsSupplied.stream()
                                .filter(gs -> gs.getSupplierId() != null && gs.getSupplierId().equals(supplier.getId()))
                                .mapToDouble(gs -> {
                                    try {
                                        return gs.getTotalAmount() != null ? gs.getTotalAmount().doubleValue() : 0.0;
                                    } catch (Exception e) {
                                        return 0.0;
                                    }
                                })
                                .sum();
                        performance.put("totalValueSupplied", totalValue);

                        return performance;
                    })
                    .sorted((a, b) -> Double.compare((double)b.get("totalValueSupplied"), (double)a.get("totalValueSupplied")))
                    .collect(Collectors.toList());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Supplier performance retrieved successfully", supplierPerformance);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving supplier performance: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProductPerformance(String startDate, String endDate, int limit) {
        try {
            List<Product> products = productRepository.findAll();

            List<Map<String, Object>> productPerformance = products.stream()
                    .map(product -> {
                        Map<String, Object> performance = new HashMap<>();
                        performance.put("productId", product.getId());
                        performance.put("productName", product.getProductName());
                        performance.put("sellingPrice", product.getSellingPrice());
                        performance.put("costPrice", product.getCostPrice());

                        // Get stock info for this product
                        Optional<Stock> stockOpt = stockRepository.findByProductId(product.getId());
                        if (stockOpt.isPresent()) {
                            Stock stock = stockOpt.get();
                            performance.put("currentStock", stock.getQuantity());
                            try {
                                double stockValue = stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                                performance.put("stockValue", stockValue);
                            } catch (Exception e) {
                                performance.put("stockValue", 0.0);
                            }
                        } else {
                            performance.put("currentStock", 0);
                            performance.put("stockValue", 0.0);
                        }

                        return performance;
                    })
                    .sorted((a, b) -> Double.compare((double)b.get("stockValue"), (double)a.get("stockValue")))
                    .limit(limit)
                    .collect(Collectors.toList());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product performance retrieved successfully", productPerformance);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving product performance: " + e.getMessage(), null);
        }
    }

    public BaseResponse getCategoryBreakdown() {
        try {
            List<Category> categories = categoryRepository.findAll();

            List<Map<String, Object>> categoryBreakdown = categories.stream()
                    .map(category -> {
                        Map<String, Object> breakdown = new HashMap<>();
                        breakdown.put("categoryId", category.getId());
                        breakdown.put("categoryName", category.getName());

                        // Count products in this category
                        long productCount = productRepository.findAll().stream()
                                .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                                .count();
                        breakdown.put("productCount", productCount);

                        // Count stock items in this category
                        List<Stock> categoryStocks = stockRepository.findAll().stream()
                                .filter(s -> s.getCategory() != null && s.getCategory().getId().equals(category.getId()))
                                .collect(Collectors.toList());

                        breakdown.put("stockItemCount", categoryStocks.size());

                        // Total stock quantity
                        int totalQuantity = categoryStocks.stream()
                                .mapToInt(Stock::getQuantity)
                                .sum();
                        breakdown.put("totalQuantity", totalQuantity);

                        // Total stock value
                        double totalValue = categoryStocks.stream()
                                .mapToDouble(s -> {
                                    try {
                                        return s.getQuantity() * Double.parseDouble(s.getUnitPrice());
                                    } catch (Exception e) {
                                        return 0.0;
                                    }
                                })
                                .sum();
                        breakdown.put("totalValue", totalValue);

                        return breakdown;
                    })
                    .sorted((a, b) -> Double.compare((double)b.get("totalValue"), (double)a.get("totalValue")))
                    .collect(Collectors.toList());

            return new BaseResponse(HttpStatus.OK.value(),
                    "Category breakdown retrieved successfully", categoryBreakdown);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving category breakdown: " + e.getMessage(), null);
        }
    }

    public BaseResponse getInventoryValuation() {
        try {
            List<Stock> allStocks = stockRepository.findAll();

            Map<String, Object> valuation = new HashMap<>();

            // Total inventory value
            double totalValue = allStocks.stream()
                    .mapToDouble(stock -> {
                        try {
                            return stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .sum();
            valuation.put("totalInventoryValue", totalValue);

            // Total items
            int totalItems = allStocks.stream()
                    .mapToInt(Stock::getQuantity)
                    .sum();
            valuation.put("totalItems", totalItems);

            // Average item value
            double avgItemValue = totalItems > 0 ? totalValue / totalItems : 0;
            valuation.put("averageItemValue", avgItemValue);

            // Breakdown by category
            Map<String, Map<String, Object>> categoryValuation = new HashMap<>();
            allStocks.stream()
                    .filter(stock -> stock.getCategory() != null)
                    .forEach(stock -> {
                        String categoryName = stock.getCategory().getName();
                        categoryValuation.putIfAbsent(categoryName, new HashMap<>());
                        Map<String, Object> catVal = categoryValuation.get(categoryName);

                        double currentValue = (double) catVal.getOrDefault("value", 0.0);
                        int currentQty = (int) catVal.getOrDefault("quantity", 0);

                        try {
                            double stockValue = stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                            catVal.put("value", currentValue + stockValue);
                        } catch (Exception e) {
                            catVal.put("value", currentValue);
                        }
                        catVal.put("quantity", currentQty + stock.getQuantity());
                    });
            valuation.put("categoryBreakdown", categoryValuation);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Inventory valuation retrieved successfully", valuation);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving inventory valuation: " + e.getMessage(), null);
        }
    }
}

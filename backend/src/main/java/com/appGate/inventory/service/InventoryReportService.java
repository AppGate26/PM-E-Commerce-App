package com.appGate.inventory.service;

import com.appGate.inventory.models.*;
import com.appGate.inventory.repository.*;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.OrderItemRepository;
import com.appGate.rbac.context.BranchSpecs;
import com.appGate.rbac.service.BranchScopeService;

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

/**
 * Every report here is built from a base list of stock / products / suppliers /
 * goods supplied. Those base lists go through the {@code scoped*()} accessors
 * below rather than {@code findAll()}, so a branch manager's reports only ever
 * count their own branch. Categories, sub-categories and payment terms are
 * company-wide reference data and stay unscoped.
 */
@Service
@RequiredArgsConstructor
public class InventoryReportService {

    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final GoodsSuppliedRepository goodsSuppliedRepository;
    private final PaymentTermRepository paymentTermRepository;
    private final OrderItemRepository orderItemRepository;
    private final BranchScopeService branchScopeService;

    /** Stock held at the caller's branch (all stock for head office / admins). */
    private List<Stock> scopedStocks() {
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? stockRepository.findAll()
                : stockRepository.findByBranchId(branchId);
    }

    /** Products the caller can see: company-wide catalogue plus their branch's own. */
    private List<Product> scopedProducts() {
        return productRepository.findAll(
                BranchSpecs.<Product>visibleTo(branchScopeService.getScopedBranchId()));
    }

    /** Suppliers the caller can see: company-wide plus their branch's own. */
    private List<Supplier> scopedSuppliers() {
        return supplierRepository.findAll(
                BranchSpecs.<Supplier>visibleTo(branchScopeService.getScopedBranchId()));
    }

    /** Goods supplied into the caller's branch. */
    private List<GoodsSupplied> scopedGoodsSupplied() {
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? goodsSuppliedRepository.findAll()
                : goodsSuppliedRepository.findByBranchId(branchId);
    }

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
            List<Stock> allStocks = scopedStocks();
            long lowStockCount = allStocks.stream()
                    .filter(stock -> stock.getReorderLevel() != null && stock.getQuantity() != null && stock.getQuantity() <= stock.getReorderLevel())
                    .count();
            overview.put("lowStockCount", lowStockCount);

            // Out of stock products
            long outOfStockCount = allStocks.stream()
                    .filter(stock -> stock.getQuantity() != null && stock.getQuantity() == 0)
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
            List<Stock> allStocks = scopedStocks();

            Map<String, Object> summary = new HashMap<>();

            // Total stock quantity
            int totalQuantity = allStocks.stream()
                    .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
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
            stockStatus.put("inStock", allStocks.stream().filter(s -> s.getReorderLevel() == null || (s.getQuantity() != null && s.getQuantity() > s.getReorderLevel())).count());
            stockStatus.put("lowStock", allStocks.stream().filter(s -> s.getReorderLevel() != null && s.getQuantity() != null && s.getQuantity() > 0 && s.getQuantity() <= s.getReorderLevel()).count());
            stockStatus.put("outOfStock", allStocks.stream().filter(s -> s.getQuantity() != null && s.getQuantity() == 0).count());
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
            List<Stock> allStocks = scopedStocks();

            List<Map<String, Object>> lowStockProducts = allStocks.stream()
                    .filter(stock -> stock.getReorderLevel() != null && stock.getQuantity() != null && stock.getQuantity() <= stock.getReorderLevel())
                    .map(stock -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("stockId", stock.getId());
                        item.put("productId", stock.getProduct() != null ? stock.getProduct().getId() : null);
                        item.put("productName", stock.getProduct() != null ? stock.getProduct().getProductName() : null);
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

                stocks = scopedStocks().stream()
                        .filter(s -> s.getStockDate() != null)
                        .filter(s -> !s.getStockDate().isBefore(start) && !s.getStockDate().isAfter(end))
                        .collect(Collectors.toList());
            } else {
                stocks = scopedStocks();
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
            List<Supplier> suppliers = scopedSuppliers();
            List<GoodsSupplied> goodsSupplied = scopedGoodsSupplied();

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
            List<Product> products = scopedProducts();

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
                        long productCount = scopedProducts().stream()
                                .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                                .count();
                        breakdown.put("productCount", productCount);

                        // Count stock items in this category
                        List<Stock> categoryStocks = scopedStocks().stream()
                                .filter(s -> s.getCategory() != null && s.getCategory().getId().equals(category.getId()))
                                .collect(Collectors.toList());

                        breakdown.put("stockItemCount", categoryStocks.size());

                        // Total stock quantity
                        int totalQuantity = categoryStocks.stream()
                                .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
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
            List<Stock> allStocks = scopedStocks();

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
                    .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
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

    // ==================== NEW REPORT ENDPOINTS ====================

    public BaseResponse getProductReport(String startDate, String endDate) {
        try {
            List<Product> products = scopedProducts();

            List<Map<String, Object>> productReport = products.stream()
                    .map(product -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("productId", product.getId());
                        report.put("productName", product.getProductName());
                        report.put("productDescription", product.getProductDescription());
                        report.put("sellingPrice", product.getSellingPrice());
                        report.put("costPrice", product.getCostPrice());
                        report.put("manufacturerName", product.getManufacturerName());
                        report.put("quantity", product.getQuantity());
                        report.put("productImage", product.getProductImage());
                        report.put("category", product.getCategory() != null ? product.getCategory().getName() : null);
                        report.put("categoryId", product.getCategory() != null ? product.getCategory().getId() : null);
                        report.put("subCategory", product.getSubCategory() != null ? product.getSubCategory().getName() : null);
                        report.put("subCategoryId", product.getSubCategory() != null ? product.getSubCategory().getId() : null);
                        report.put("supplier", product.getSupplier() != null ? product.getSupplier().getCustomerName() : null);
                        report.put("supplierId", product.getSupplier() != null ? product.getSupplier().getId() : null);

                        // Get stock info
                        Optional<Stock> stockOpt = stockRepository.findByProductId(product.getId());
                        if (stockOpt.isPresent()) {
                            Stock stock = stockOpt.get();
                            report.put("stockQuantity", stock.getQuantity());
                            report.put("reorderLevel", stock.getReorderLevel());
                            report.put("stockUnitPrice", stock.getUnitPrice());
                            try {
                                double stockValue = stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                                report.put("stockValue", stockValue);
                            } catch (Exception e) {
                                report.put("stockValue", 0.0);
                            }
                        } else {
                            report.put("stockQuantity", 0);
                            report.put("reorderLevel", 0);
                            report.put("stockUnitPrice", null);
                            report.put("stockValue", 0.0);
                        }

                        return report;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("totalProducts", products.size());
            result.put("products", productReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving product report: " + e.getMessage(), null);
        }
    }

    /**
     * Per-product bought/sold/balance report (INV #3): how much of a product came in,
     * how much sold, and what's left.
     *
     * "Sold" and "amount sold" are the sum of every {@link OrderItem} for the product
     * (optionally restricted to a date range on the line item's createdAt). "Balance" is
     * the product's current stock quantity - stock is decremented at the point of sale,
     * so it already reflects bought-minus-sold. "Bought" is derived as balance + sold
     * rather than read off a separate purchases ledger, since that is the only figure
     * consistent with how stock quantity is actually maintained.
     */
    public BaseResponse getProductMovementReport(String startDate, String endDate) {
        try {
            LocalDate start = null;
            LocalDate end = null;
            if (startDate != null && endDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                start = LocalDate.parse(startDate, formatter);
                end = LocalDate.parse(endDate, formatter);
            }

            List<Product> products = scopedProducts();

            final LocalDate rangeStart = start;
            final LocalDate rangeEnd = end;
            List<Map<String, Object>> movement = products.stream()
                    .map(product -> {
                        List<OrderItem> items = orderItemRepository.findByProductId(product.getId());
                        if (rangeStart != null) {
                            items = items.stream()
                                    .filter(i -> i.getCreatedAt() != null)
                                    .filter(i -> {
                                        LocalDate d = i.getCreatedAt().toLocalDate();
                                        return !d.isBefore(rangeStart) && !d.isAfter(rangeEnd);
                                    })
                                    .collect(Collectors.toList());
                        }

                        int sold = items.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
                        double amountSold = items.stream().mapToDouble(i -> i.getTotal() != null ? i.getTotal() : 0.0).sum();

                        int balance = stockRepository.findByProductId(product.getId())
                                .map(Stock::getQuantity)
                                .orElse(product.getQuantity() != null ? product.getQuantity() : 0);

                        Map<String, Object> row = new HashMap<>();
                        row.put("productId", product.getId());
                        row.put("productName", product.getProductName());
                        row.put("categoryName", product.getCategory() != null ? product.getCategory().getName() : null);
                        row.put("bought", balance + sold);
                        row.put("sold", sold);
                        row.put("amountSold", amountSold);
                        row.put("balance", balance);
                        return row;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("totalProducts", movement.size());
            result.put("products", movement);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product movement report retrieved successfully", result);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving product movement report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProductByCategoryReport() {
        try {
            List<Category> categories = categoryRepository.findAll();

            List<Map<String, Object>> categoryReport = categories.stream()
                    .map(category -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("categoryId", category.getId());
                        report.put("categoryName", category.getName());
                        report.put("categoryDescription", category.getDescription());

                        // Get products in this category
                        List<Product> categoryProducts = scopedProducts().stream()
                                .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                                .collect(Collectors.toList());

                        report.put("productCount", categoryProducts.size());

                        // Calculate total values
                        double totalSellingPrice = categoryProducts.stream()
                                .mapToDouble(Product::getSellingPrice)
                                .sum();
                        double totalCostPrice = categoryProducts.stream()
                                .mapToDouble(Product::getCostPrice)
                                .sum();

                        report.put("totalSellingPrice", totalSellingPrice);
                        report.put("totalCostPrice", totalCostPrice);

                        // Get stock info for category
                        List<Stock> categoryStocks = scopedStocks().stream()
                                .filter(s -> s.getCategory() != null && s.getCategory().getId().equals(category.getId()))
                                .collect(Collectors.toList());

                        int totalStockQuantity = categoryStocks.stream()
                                .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
                                .sum();
                        report.put("totalStockQuantity", totalStockQuantity);

                        double totalStockValue = categoryStocks.stream()
                                .mapToDouble(s -> {
                                    try {
                                        return s.getQuantity() * Double.parseDouble(s.getUnitPrice());
                                    } catch (Exception e) {
                                        return 0.0;
                                    }
                                })
                                .sum();
                        report.put("totalStockValue", totalStockValue);

                        // List products
                        List<Map<String, Object>> productList = categoryProducts.stream()
                                .map(p -> {
                                    Map<String, Object> prod = new HashMap<>();
                                    prod.put("productId", p.getId());
                                    prod.put("productName", p.getProductName());
                                    prod.put("sellingPrice", p.getSellingPrice());
                                    prod.put("costPrice", p.getCostPrice());
                                    return prod;
                                })
                                .collect(Collectors.toList());
                        report.put("products", productList);

                        return report;
                    })
                    .sorted((a, b) -> Integer.compare(((Number) b.get("productCount")).intValue(), ((Number) a.get("productCount")).intValue()))
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("totalCategories", categories.size());
            result.put("categories", categoryReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product by category report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving product by category report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProductBySubCategoryReport() {
        try {
            List<SubCategory> subCategories = subCategoryRepository.findAll();

            List<Map<String, Object>> subCategoryReport = subCategories.stream()
                    .map(subCategory -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("subCategoryId", subCategory.getId());
                        report.put("subCategoryName", subCategory.getName());
                        report.put("subCategoryDescription", subCategory.getDescription());
                        report.put("parentCategoryId", subCategory.getCategory() != null ? subCategory.getCategory().getId() : null);
                        report.put("parentCategoryName", subCategory.getCategory() != null ? subCategory.getCategory().getName() : null);

                        // Get products in this sub-category
                        List<Product> subCategoryProducts = scopedProducts().stream()
                                .filter(p -> p.getSubCategory() != null && p.getSubCategory().getId().equals(subCategory.getId()))
                                .collect(Collectors.toList());

                        report.put("productCount", subCategoryProducts.size());

                        // Calculate total values
                        double totalSellingPrice = subCategoryProducts.stream()
                                .mapToDouble(Product::getSellingPrice)
                                .sum();
                        double totalCostPrice = subCategoryProducts.stream()
                                .mapToDouble(Product::getCostPrice)
                                .sum();

                        report.put("totalSellingPrice", totalSellingPrice);
                        report.put("totalCostPrice", totalCostPrice);

                        // Get stock info for sub-category
                        List<Stock> subCategoryStocks = scopedStocks().stream()
                                .filter(s -> s.getSubCategory() != null && s.getSubCategory().getId().equals(subCategory.getId()))
                                .collect(Collectors.toList());

                        int totalStockQuantity = subCategoryStocks.stream()
                                .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
                                .sum();
                        report.put("totalStockQuantity", totalStockQuantity);

                        double totalStockValue = subCategoryStocks.stream()
                                .mapToDouble(s -> {
                                    try {
                                        return s.getQuantity() * Double.parseDouble(s.getUnitPrice());
                                    } catch (Exception e) {
                                        return 0.0;
                                    }
                                })
                                .sum();
                        report.put("totalStockValue", totalStockValue);

                        // List products
                        List<Map<String, Object>> productList = subCategoryProducts.stream()
                                .map(p -> {
                                    Map<String, Object> prod = new HashMap<>();
                                    prod.put("productId", p.getId());
                                    prod.put("productName", p.getProductName());
                                    prod.put("sellingPrice", p.getSellingPrice());
                                    prod.put("costPrice", p.getCostPrice());
                                    return prod;
                                })
                                .collect(Collectors.toList());
                        report.put("products", productList);

                        return report;
                    })
                    .sorted((a, b) -> Integer.compare(((Number) b.get("productCount")).intValue(), ((Number) a.get("productCount")).intValue()))
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("totalSubCategories", subCategories.size());
            result.put("subCategories", subCategoryReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product by sub-category report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving product by sub-category report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getSuppliersReport() {
        try {
            List<Supplier> suppliers = scopedSuppliers();
            List<GoodsSupplied> allGoodsSupplied = scopedGoodsSupplied();
            List<PaymentTerm> allPaymentTerms = paymentTermRepository.findAll();

            List<Map<String, Object>> supplierReport = suppliers.stream()
                    .map(supplier -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("supplierId", supplier.getSupplierId());
                        report.put("customerName", supplier.getCustomerName());
                        report.put("contactName", supplier.getContactName());
                        report.put("contactEmail", supplier.getContactEmail());
                        report.put("contactPhone", supplier.getContactPhoneNo());
                        report.put("address", supplier.getAddress());
                        report.put("taxId", supplier.getTaxId());
                        report.put("paymentTerms", supplier.getPaymentTerms());
                        report.put("deliveryTerms", supplier.getDeliveryTerms());

                        // Get goods supplied by this supplier
                        List<GoodsSupplied> supplierGoods = allGoodsSupplied.stream()
                                .filter(gs -> gs.getSupplierId() != null && gs.getSupplierId().equals(supplier.getId()))
                                .collect(Collectors.toList());

                        report.put("totalGoodsSupplied", supplierGoods.size());

                        double totalValueSupplied = supplierGoods.stream()
                                .mapToDouble(gs -> gs.getTotalAmount() != null ? gs.getTotalAmount().doubleValue() : 0.0)
                                .sum();
                        report.put("totalValueSupplied", totalValueSupplied);

                        // Get payment terms for this supplier
                        List<PaymentTerm> supplierPaymentTerms = allPaymentTerms.stream()
                                .filter(pt -> pt.getSupplierId() != null && pt.getSupplierId().equals(supplier.getId()))
                                .collect(Collectors.toList());

                        report.put("totalPaymentTerms", supplierPaymentTerms.size());

                        double totalInvoiceAmount = supplierPaymentTerms.stream()
                                .mapToDouble(pt -> pt.getInvoiceAmount() != null ? pt.getInvoiceAmount().doubleValue() : 0.0)
                                .sum();
                        report.put("totalInvoiceAmount", totalInvoiceAmount);

                        // Get products from this supplier
                        long productCount = scopedProducts().stream()
                                .filter(p -> p.getSupplier() != null && p.getSupplier().getId().equals(supplier.getId()))
                                .count();
                        report.put("productCount", productCount);

                        // Get stock entries from this supplier
                        List<Stock> supplierStocks = stockRepository.findBySupplierId(supplier.getId());
                        report.put("stockEntryCount", supplierStocks.size());

                        return report;
                    })
                    .sorted((a, b) -> Double.compare((double)b.get("totalValueSupplied"), (double)a.get("totalValueSupplied")))
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("totalSuppliers", suppliers.size());
            result.put("suppliers", supplierReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Suppliers report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving suppliers report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getGoodsSuppliedReport(String startDate, String endDate) {
        try {
            List<GoodsSupplied> goodsSupplied = scopedGoodsSupplied();
            List<Supplier> allSuppliers = scopedSuppliers();
            Map<Long, Supplier> supplierMap = allSuppliers.stream()
                    .collect(Collectors.toMap(Supplier::getId, s -> s, (s1, s2) -> s1));

            // Apply date filter if provided
            if (startDate != null && endDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDate start = LocalDate.parse(startDate, formatter);
                LocalDate end = LocalDate.parse(endDate, formatter);

                goodsSupplied = goodsSupplied.stream()
                        .filter(gs -> gs.getDateSupplied() != null)
                        .filter(gs -> !gs.getDateSupplied().isBefore(start) && !gs.getDateSupplied().isAfter(end))
                        .collect(Collectors.toList());
            }

            List<Map<String, Object>> goodsReport = goodsSupplied.stream()
                    .map(gs -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("id", gs.getId());
                        report.put("supplierId", gs.getSupplierId());

                        Supplier supplier = supplierMap.get(gs.getSupplierId());
                        report.put("supplierName", supplier != null ? supplier.getCustomerName() : null);

                        report.put("productId", gs.getProductId());
                        report.put("suppliedProduct", gs.getSuppliedProduct());
                        report.put("unitPrice", gs.getUnitPrice());
                        report.put("deliveryFee", gs.getDeliveryFee());
                        report.put("totalAmount", gs.getTotalAmount());
                        report.put("dateSupplied", gs.getDateSupplied());
                        report.put("vehicleNumber", gs.getVehicleNumber());
                        report.put("invoiceNumber", gs.getInvoiceNumber());
                        report.put("lpoNumber", gs.getLpoNumber());
                        report.put("waybillNumber", gs.getWaybillNumber());
                        report.put("warehouseName", gs.getWarehouseName());
                        report.put("terminalCode", gs.getTerminalCode());

                        return report;
                    })
                    .sorted((a, b) -> {
                        LocalDate dateA = (LocalDate) a.get("dateSupplied");
                        LocalDate dateB = (LocalDate) b.get("dateSupplied");
                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;
                        if (dateB == null) return -1;
                        return dateB.compareTo(dateA);
                    })
                    .collect(Collectors.toList());

            // Calculate summary
            double totalValue = goodsSupplied.stream()
                    .mapToDouble(gs -> gs.getTotalAmount() != null ? gs.getTotalAmount().doubleValue() : 0.0)
                    .sum();

            double totalDeliveryFees = goodsSupplied.stream()
                    .mapToDouble(gs -> gs.getDeliveryFee() != null ? gs.getDeliveryFee().doubleValue() : 0.0)
                    .sum();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRecords", goodsSupplied.size());
            result.put("totalValue", totalValue);
            result.put("totalDeliveryFees", totalDeliveryFees);
            result.put("goodsSupplied", goodsReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Goods supplied report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving goods supplied report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getPaymentTermsReport() {
        try {
            List<PaymentTerm> paymentTerms = paymentTermRepository.findAll();
            List<Supplier> allSuppliers = scopedSuppliers();
            Map<Long, Supplier> supplierMap = allSuppliers.stream()
                    .collect(Collectors.toMap(Supplier::getId, s -> s, (s1, s2) -> s1));

            List<Map<String, Object>> paymentTermReport = paymentTerms.stream()
                    .map(pt -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("id", pt.getId());
                        report.put("invoiceNumber", pt.getInvoiceNumber());
                        report.put("invoiceAmount", pt.getInvoiceAmount());
                        report.put("supplierId", pt.getSupplierId());

                        Supplier supplier = supplierMap.get(pt.getSupplierId());
                        report.put("supplierName", supplier != null ? supplier.getCustomerName() : null);

                        report.put("periodOfPayment", pt.getPeriodOfPayment());
                        report.put("rulesForPayment", pt.getRulesForPayment());
                        report.put("advancePaymentDetails", pt.getAdvancePaymentDetails());
                        report.put("percentageMade", pt.getPercentageMade());
                        report.put("tenureOfDelivery", pt.getTenureOfDelivery());
                        report.put("processIncaseOfNondelivery", pt.getProcessIncaseOfNondelivery());
                        report.put("timelineOfDelivery", pt.getTimelineOfDelivery());
                        report.put("acceptedPaymentMethods", pt.getAcceptedPaymentMethods());
                        report.put("discountOnOrder", pt.getDiscountOnOrder());
                        report.put("paymentDate", pt.getPaymentDate());
                        report.put("isB2B", pt.getIsB2B());

                        return report;
                    })
                    .sorted((a, b) -> {
                        LocalDate dateA = (LocalDate) a.get("paymentDate");
                        LocalDate dateB = (LocalDate) b.get("paymentDate");
                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;
                        if (dateB == null) return -1;
                        return dateB.compareTo(dateA);
                    })
                    .collect(Collectors.toList());

            // Calculate summary
            double totalInvoiceAmount = paymentTerms.stream()
                    .mapToDouble(pt -> pt.getInvoiceAmount() != null ? pt.getInvoiceAmount().doubleValue() : 0.0)
                    .sum();

            double totalDiscount = paymentTerms.stream()
                    .mapToDouble(pt -> pt.getDiscountOnOrder() != null ? pt.getDiscountOnOrder().doubleValue() : 0.0)
                    .sum();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRecords", paymentTerms.size());
            result.put("totalInvoiceAmount", totalInvoiceAmount);
            result.put("totalDiscount", totalDiscount);
            result.put("paymentTerms", paymentTermReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Payment terms report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving payment terms report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getOpeningStockReport() {
        try {
            List<Stock> openingStocks = stockRepository.findByIsOpeningStockTrue();
            List<Product> allProducts = scopedProducts();
            Map<Long, Product> productMap = allProducts.stream()
                    .filter(p -> p.getId() != null)
                    .collect(Collectors.toMap(Product::getId, p -> p, (p1, p2) -> p1));

            List<Map<String, Object>> openingStockReport = openingStocks.stream()
                    .map(stock -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("stockId", stock.getId());
                        report.put("description", stock.getDescription());
                        report.put("quantity", stock.getQuantity());
                        report.put("reorderLevel", stock.getReorderLevel());
                        report.put("unitPrice", stock.getUnitPrice());
                        report.put("stockDate", stock.getStockDate());
                        report.put("enteredBy", stock.getEnteredBy());
                        report.put("supplierId", stock.getSupplierId());
                        report.put("accountToCredit", stock.getAccountToCredit());
                        report.put("accountToDebit", stock.getAccountToDebit());

                        if (stock.getProduct() != null) {
                            report.put("productId", stock.getProduct().getId());
                            report.put("productName", stock.getProduct().getProductName());
                        } else {
                            report.put("productId", null);
                            report.put("productName", null);
                        }

                        report.put("category", stock.getCategory() != null ? stock.getCategory().getName() : null);
                        report.put("categoryId", stock.getCategory() != null ? stock.getCategory().getId() : null);
                        report.put("subCategory", stock.getSubCategory() != null ? stock.getSubCategory().getName() : null);
                        report.put("subCategoryId", stock.getSubCategory() != null ? stock.getSubCategory().getId() : null);

                        try {
                            double stockValue = stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                            report.put("stockValue", stockValue);
                        } catch (Exception e) {
                            report.put("stockValue", 0.0);
                        }

                        return report;
                    })
                    .sorted((a, b) -> {
                        LocalDate dateA = (LocalDate) a.get("stockDate");
                        LocalDate dateB = (LocalDate) b.get("stockDate");
                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;
                        if (dateB == null) return -1;
                        return dateB.compareTo(dateA);
                    })
                    .collect(Collectors.toList());

            // Calculate summary
            int totalQuantity = openingStocks.stream()
                    .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
                    .sum();

            double totalValue = openingStocks.stream()
                    .mapToDouble(stock -> {
                        try {
                            return stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .sum();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRecords", openingStocks.size());
            result.put("totalQuantity", totalQuantity);
            result.put("totalValue", totalValue);
            result.put("openingStocks", openingStockReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Opening stock report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving opening stock report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getStockReport(String supplierIds, String startDate, String endDate) {
        try {
            List<Stock> allStocks = scopedStocks();

            // Filter by stock date range if provided
            if (startDate != null && endDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDate start = LocalDate.parse(startDate, formatter);
                LocalDate end = LocalDate.parse(endDate, formatter);

                allStocks = allStocks.stream()
                        .filter(s -> s.getStockDate() != null)
                        .filter(s -> !s.getStockDate().isBefore(start) && !s.getStockDate().isAfter(end))
                        .collect(Collectors.toList());
            }

            // Filter by supplier IDs if provided (comma-separated list like "1,2,3")
            if (supplierIds != null && !supplierIds.trim().isEmpty()) {
                String[] ids = supplierIds.split(",");
                Set<Long> supplierIdSet = new HashSet<>();
                for (String id : ids) {
                    try {
                        supplierIdSet.add(Long.parseLong(id.trim()));
                    } catch (NumberFormatException e) {
                        // Skip invalid IDs
                    }
                }
                if (!supplierIdSet.isEmpty()) {
                    allStocks = allStocks.stream()
                            .filter(s -> s.getSupplierId() != null && supplierIdSet.contains(s.getSupplierId()))
                            .collect(Collectors.toList());
                }
            }

            List<Map<String, Object>> stockReport = allStocks.stream()
                    .map(stock -> {
                        Map<String, Object> report = new HashMap<>();
                        report.put("id", stock.getId());
                        report.put("stockId", stock.getId());
                        report.put("description", stock.getDescription());
                        report.put("quantity", stock.getQuantity());
                        report.put("reorderLevel", stock.getReorderLevel());
                        report.put("unitPrice", stock.getUnitPrice());
                        report.put("costPrice", stock.getCostPrice());
                        report.put("stockDate", stock.getStockDate());
                        report.put("enteredBy", stock.getEnteredBy());
                        report.put("supplierId", stock.getSupplierId());
                        report.put("warehouseId", stock.getWarehouseId());
                        report.put("sourceType", stock.getSourceType());
                        report.put("isOpeningStock", stock.getIsOpeningStock());
                        report.put("accountToCredit", stock.getAccountToCredit());
                        report.put("accountToDebit", stock.getAccountToDebit());

                        if (stock.getProduct() != null) {
                            report.put("productId", stock.getProduct().getId());
                            report.put("productName", stock.getProduct().getProductName());
                        } else {
                            report.put("productId", null);
                            report.put("productName", null);
                        }

                        report.put("categoryName", stock.getCategory() != null ? stock.getCategory().getName() : null);
                        report.put("category", stock.getCategory() != null ? stock.getCategory().getName() : null);
                        report.put("categoryId", stock.getCategory() != null ? stock.getCategory().getId() : null);
                        report.put("subCategoryName", stock.getSubCategory() != null ? stock.getSubCategory().getName() : null);
                        report.put("subCategory", stock.getSubCategory() != null ? stock.getSubCategory().getName() : null);
                        report.put("subCategoryId", stock.getSubCategory() != null ? stock.getSubCategory().getId() : null);

                        try {
                            double stockValue = stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                            report.put("stockValue", stockValue);
                        } catch (Exception e) {
                            report.put("stockValue", 0.0);
                        }

                        // Stock status
                        String status;
                        int qty = stock.getQuantity() != null ? stock.getQuantity() : 0;
                        int reorder = stock.getReorderLevel() != null ? stock.getReorderLevel() : 0;
                        if (qty == 0) {
                            status = "OUT_OF_STOCK";
                        } else if (stock.getReorderLevel() != null && qty <= reorder) {
                            status = "LOW_STOCK";
                        } else {
                            status = "IN_STOCK";
                        }
                        report.put("status", status);

                        return report;
                    })
                    .sorted((a, b) -> {
                        LocalDate dateA = (LocalDate) a.get("stockDate");
                        LocalDate dateB = (LocalDate) b.get("stockDate");
                        if (dateA == null && dateB == null) return 0;
                        if (dateA == null) return 1;
                        if (dateB == null) return -1;
                        return dateB.compareTo(dateA);
                    })
                    .collect(Collectors.toList());

            // Calculate summary
            int totalQuantity = allStocks.stream()
                    .mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0)
                    .sum();

            double totalValue = allStocks.stream()
                    .mapToDouble(stock -> {
                        try {
                            return stock.getQuantity() * Double.parseDouble(stock.getUnitPrice());
                        } catch (Exception e) {
                            return 0.0;
                        }
                    })
                    .sum();

            long inStockCount = allStocks.stream()
                    .filter(s -> s.getReorderLevel() == null || (s.getQuantity() != null && s.getQuantity() > s.getReorderLevel()))
                    .count();

            long lowStockCount = allStocks.stream()
                    .filter(s -> s.getReorderLevel() != null && s.getQuantity() != null && s.getQuantity() > 0 && s.getQuantity() <= s.getReorderLevel())
                    .count();

            long outOfStockCount = allStocks.stream()
                    .filter(s -> s.getQuantity() != null && s.getQuantity() == 0)
                    .count();

            Map<String, Object> result = new HashMap<>();
            result.put("totalRecords", allStocks.size());
            result.put("totalQuantity", totalQuantity);
            result.put("totalValue", totalValue);
            result.put("inStockCount", inStockCount);
            result.put("lowStockCount", lowStockCount);
            result.put("outOfStockCount", outOfStockCount);
            result.put("stocks", stockReport);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Stock report retrieved successfully", result);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving stock report: " + e.getMessage(), null);
        }
    }
}

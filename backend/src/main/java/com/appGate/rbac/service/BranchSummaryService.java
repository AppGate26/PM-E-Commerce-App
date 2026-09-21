package com.appGate.rbac.service;

import com.appGate.account.models.JournalEntry;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.JournalEntryRepository;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.warehouse.models.Warehouse;
import com.appGate.warehouse.repository.WarehouseProductRepository;
import com.appGate.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Head-office consolidated reporting: for each branch, roll up stock, sales and
 * account (journal) figures so a head-office user can see every branch side by
 * side (branches stock, branches sales, branches income/expense).
 */
@Service
@RequiredArgsConstructor
public class BranchSummaryService {

    private final BranchRepository branchRepository;
    private final StockRepository stockRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseProductRepository warehouseProductRepository;

    public BaseResponse getConsolidatedSummary() {
        List<Map<String, Object>> rows = new ArrayList<>();

        BigDecimal grandSales = BigDecimal.ZERO;
        BigDecimal grandDebit = BigDecimal.ZERO;
        BigDecimal grandCredit = BigDecimal.ZERO;
        long grandStockItems = 0;
        long grandStockQty = 0;
        long grandWarehouses = 0;
        long grandWarehouseQty = 0;

        for (Branch branch : branchRepository.findAll()) {
            Long branchId = branch.getId();

            List<Stock> stocks = stockRepository.findByBranchId(branchId);
            long stockItems = stocks.size();
            long stockQty = stocks.stream()
                    .mapToLong(s -> s.getQuantity() == null ? 0 : s.getQuantity())
                    .sum();

            // Warehouse roll-up for the branch: number of warehouses and total units held.
            List<Warehouse> warehouses = warehouseRepository.findByBranchId(branchId);
            long warehouseCount = warehouses.size();
            long warehouseQty = warehouses.stream()
                    .flatMap(w -> warehouseProductRepository.findByWarehouseId(w.getId()).stream())
                    .mapToLong(wp -> wp.getQuantityOnHand() == null ? 0 : wp.getQuantityOnHand())
                    .sum();

            List<SalesOrder> sales = salesOrderRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
            BigDecimal salesTotal = sales.stream()
                    .map(s -> s.getTotalAmount() == null ? BigDecimal.ZERO : s.getTotalAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<JournalEntry> entries = journalEntryRepository.findByBranchIdOrderByTransactionDateDesc(branchId);
            BigDecimal debit = BigDecimal.ZERO;
            BigDecimal credit = BigDecimal.ZERO;
            for (JournalEntry entry : entries) {
                if (entry.getJournalLines() == null) continue;
                for (JournalLine line : entry.getJournalLines()) {
                    if (line.getDebit() != null) debit = debit.add(line.getDebit());
                    if (line.getCredit() != null) credit = credit.add(line.getCredit());
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("branchId", branchId);
            row.put("branchCode", branch.getBranchCode());
            row.put("branchName", branch.getBranchName());
            row.put("stockItems", stockItems);
            row.put("stockQuantity", stockQty);
            row.put("warehouseCount", warehouseCount);
            row.put("warehouseQuantity", warehouseQty);
            row.put("salesCount", (long) sales.size());
            row.put("salesTotal", salesTotal);
            row.put("totalDebit", debit);
            row.put("totalCredit", credit);
            // Income vs expense proxy for the branch: credits (income) less debits.
            row.put("netPosition", credit.subtract(debit));
            rows.add(row);

            grandStockItems += stockItems;
            grandStockQty += stockQty;
            grandWarehouses += warehouseCount;
            grandWarehouseQty += warehouseQty;
            grandSales = grandSales.add(salesTotal);
            grandDebit = grandDebit.add(debit);
            grandCredit = grandCredit.add(credit);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reportTitle", "Head Office - Consolidated Branch Summary");
        result.put("branches", rows);
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("stockItems", grandStockItems);
        totals.put("stockQuantity", grandStockQty);
        totals.put("warehouseCount", grandWarehouses);
        totals.put("warehouseQuantity", grandWarehouseQty);
        totals.put("salesTotal", grandSales);
        totals.put("totalDebit", grandDebit);
        totals.put("totalCredit", grandCredit);
        result.put("totals", totals);

        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }
}

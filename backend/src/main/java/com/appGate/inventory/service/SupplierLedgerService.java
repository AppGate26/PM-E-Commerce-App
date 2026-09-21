package com.appGate.inventory.service;

import com.appGate.inventory.dto.SupplierLedgerDto;
import com.appGate.inventory.models.Supplier;
import com.appGate.inventory.models.SupplierLedger;
import com.appGate.inventory.repository.SupplierLedgerRepository;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierLedgerService {

    private final SupplierLedgerRepository ledgerRepository;
    private final SupplierRepository supplierRepository;

    public BaseResponse addLedgerEntry(SupplierLedgerDto dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));

        List<SupplierLedger> existing = ledgerRepository
                .findBySupplierIdOrderByTransactionDateAscIdAsc(dto.getSupplierId());

        BigDecimal previousBalance = existing.isEmpty()
                ? BigDecimal.ZERO
                : existing.get(existing.size() - 1).getBalance();

        BigDecimal debit = dto.getDebit() != null ? dto.getDebit() : BigDecimal.ZERO;
        BigDecimal credit = dto.getCredit() != null ? dto.getCredit() : BigDecimal.ZERO;
        BigDecimal newBalance = previousBalance.add(debit).subtract(credit);

        SupplierLedger entry = new SupplierLedger();
        entry.setSupplierId(dto.getSupplierId());
        entry.setSupplierName(supplier.getCustomerName());
        entry.setSupplierCode(supplier.getSupplierId());
        entry.setTransactionDate(dto.getTransactionDate() != null ? dto.getTransactionDate() : LocalDate.now());
        entry.setDescription(dto.getDescription());
        entry.setReferenceNo(dto.getReferenceNo());
        entry.setTransactionType(dto.getTransactionType());
        entry.setDebit(debit);
        entry.setCredit(credit);
        entry.setBalance(newBalance);

        SupplierLedger saved = ledgerRepository.save(entry);
        return new BaseResponse(HttpStatus.CREATED.value(), "Ledger entry added successfully", saved);
    }

    public BaseResponse getLedgerBySupplierId(Long supplierId, String startDate, String endDate, int page, int size) {
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").ascending().and(Sort.by("id").ascending()));

        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            Page<SupplierLedger> result = ledgerRepository.findBySupplierIdAndTransactionDateBetween(supplierId, start, end, pageable);
            return new BaseResponse(HttpStatus.OK.value(), "successful", result);
        }

        Page<SupplierLedger> result = ledgerRepository.findBySupplierId(supplierId, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    public BaseResponse getAllLedgerEntries(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<SupplierLedger> result = ledgerRepository.findAllByOrderByTransactionDateDescIdDesc(pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }
}

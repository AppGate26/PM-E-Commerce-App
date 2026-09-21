package com.appGate.inventory.repository;

import com.appGate.inventory.enums.InvoiceStatus;
import com.appGate.inventory.enums.InvoiceType;
import com.appGate.inventory.models.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByInvoiceType(InvoiceType invoiceType);

    List<Invoice> findByStatus(InvoiceStatus status);

    List<Invoice> findBySupplierId(Long supplierId);

    List<Invoice> findByInvoiceDateBetween(LocalDate startDate, LocalDate endDate);

    List<Invoice> findByDueDateBeforeAndStatus(LocalDate date, InvoiceStatus status);

    // --- Branch-scoped ---
    List<Invoice> findByBranchId(Long branchId);

    List<Invoice> findByInvoiceTypeAndBranchId(InvoiceType invoiceType, Long branchId);

    List<Invoice> findByStatusAndBranchId(InvoiceStatus status, Long branchId);

    List<Invoice> findBySupplierIdAndBranchId(Long supplierId, Long branchId);

    List<Invoice> findByDueDateBeforeAndStatusAndBranchId(LocalDate date, InvoiceStatus status, Long branchId);
}

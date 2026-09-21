package com.appGate.inventory.repository;

import com.appGate.inventory.models.SupplierLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SupplierLedgerRepository extends JpaRepository<SupplierLedger, Long> {

    List<SupplierLedger> findBySupplierIdOrderByTransactionDateAscIdAsc(Long supplierId);

    Page<SupplierLedger> findBySupplierId(Long supplierId, Pageable pageable);

    Page<SupplierLedger> findBySupplierIdAndTransactionDateBetween(
            Long supplierId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<SupplierLedger> findAllByOrderByTransactionDateDescIdDesc(Pageable pageable);
}

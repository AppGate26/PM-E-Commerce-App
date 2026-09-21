package com.appGate.inventory.repository;

import com.appGate.inventory.models.SupplierPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, Long> {

    List<SupplierPayment> findBySupplierIdOrderByPaymentDateDesc(Long supplierId);

    // --- Branch-scoped ---
    List<SupplierPayment> findByBranchId(Long branchId);
}

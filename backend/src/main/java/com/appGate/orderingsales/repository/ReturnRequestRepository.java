package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.enums.ReturnStatus;
import com.appGate.orderingsales.models.ReturnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    Page<ReturnRequest> findByCustomerId(Long customerId, Pageable pageable);

    Page<ReturnRequest> findBySalesOrderId(Long salesOrderId, Pageable pageable);

    Page<ReturnRequest> findByStatus(ReturnStatus status, Pageable pageable);

    List<ReturnRequest> findBySalesOrderId(Long salesOrderId);

    // --- Branch-scoped ---
    Page<ReturnRequest> findByBranchId(Long branchId, Pageable pageable);

    Page<ReturnRequest> findByStatusAndBranchId(ReturnStatus status, Long branchId, Pageable pageable);
}

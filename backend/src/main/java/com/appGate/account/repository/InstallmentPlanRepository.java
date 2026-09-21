package com.appGate.account.repository;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.InstallmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstallmentPlanRepository extends JpaRepository<InstallmentPlan, Long> {

    List<InstallmentPlan> findByUserId(Long userId);

    List<InstallmentPlan> findByUserIdAndStatus(Long userId, InstallmentStatus status);

    List<InstallmentPlan> findByOrderId(Long orderId);

    // Walk-in/online credit sale's shadow plan (Phase 2 of the order/SalesOrder
    // unification) - see InstallmentPlan.salesOrderId.
    java.util.Optional<InstallmentPlan> findBySalesOrderId(Long salesOrderId);

    @Query("SELECT SUM(ip.remainingBalance) FROM InstallmentPlan ip WHERE ip.status = 'ACTIVE'")
    Double sumAllActiveLoanBalances();

    @Query("SELECT SUM(ip.remainingBalance) FROM InstallmentPlan ip WHERE ip.userId = :userId AND ip.status = 'ACTIVE'")
    Double sumActiveLoanBalanceByUser(Long userId);
}

package com.appGate.account.repository;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.Installment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InstallmentRepository extends JpaRepository<Installment, Long> {

    List<Installment> findByInstallmentPlanId(Long installmentPlanId);

    List<Installment> findByInstallmentPlanIdAndStatus(Long installmentPlanId, InstallmentStatus status);

    @Query("SELECT i FROM Installment i WHERE i.installmentPlan.userId = :userId AND i.status = :status")
    List<Installment> findByUserIdAndStatus(Long userId, InstallmentStatus status);

    @Query("SELECT i FROM Installment i WHERE i.installmentPlan.userId = :userId AND i.dueDate BETWEEN :startDate AND :endDate AND i.status = 'PENDING'")
    List<Installment> findUpcomingPayments(Long userId, LocalDate startDate, LocalDate endDate);
}

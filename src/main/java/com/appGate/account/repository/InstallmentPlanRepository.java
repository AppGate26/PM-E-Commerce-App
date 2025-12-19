package com.appGate.account.repository;

import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.models.InstallmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstallmentPlanRepository extends JpaRepository<InstallmentPlan, Long> {

    List<InstallmentPlan> findByUserId(Long userId);

    List<InstallmentPlan> findByUserIdAndStatus(Long userId, InstallmentStatus status);

    List<InstallmentPlan> findByOrderId(Long orderId);
}

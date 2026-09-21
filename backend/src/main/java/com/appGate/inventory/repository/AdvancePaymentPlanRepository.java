package com.appGate.inventory.repository;

import com.appGate.inventory.models.AdvancePaymentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvancePaymentPlanRepository extends JpaRepository<AdvancePaymentPlan, Long> {

    List<AdvancePaymentPlan> findByIsActiveTrue();
}

package com.appGate.account.repository;

import com.appGate.account.models.DeliverySetup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliverySetupRepository extends JpaRepository<DeliverySetup, Long> {

    List<DeliverySetup> findByIsActiveTrue();

    List<DeliverySetup> findByCategoryName(String categoryName);
}

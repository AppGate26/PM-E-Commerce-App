package com.appGate.account.repository;

import com.appGate.account.models.DiscountSetup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountSetupRepository extends JpaRepository<DiscountSetup, Long> {

    List<DiscountSetup> findByIsActiveTrue();

    List<DiscountSetup> findByCategoryName(String categoryName);
}

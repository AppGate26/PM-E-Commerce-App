package com.appGate.account.repository;

import com.appGate.account.models.LoanPercentageSetup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanPercentageSetupRepository extends JpaRepository<LoanPercentageSetup, Long> {
    List<LoanPercentageSetup> findByIsActiveTrue();
    List<LoanPercentageSetup> findByCategoryName(String categoryName);
}

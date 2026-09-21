package com.appGate.account.repository;

import com.appGate.account.models.ChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ChartOfAccountRepository extends JpaRepository<ChartOfAccount, Long>, JpaSpecificationExecutor<ChartOfAccount> {
    List<ChartOfAccount> findByControlAccountId(Long controlAccountId);
    Optional<ChartOfAccount> findByChartOfAccountId(String chartOfAccountId);
}

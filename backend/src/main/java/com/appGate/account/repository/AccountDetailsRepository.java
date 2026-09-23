package com.appGate.account.repository;

import com.appGate.account.enums.GlPurpose;
import com.appGate.account.models.AccountDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface AccountDetailsRepository extends JpaRepository<AccountDetails, Long>, JpaSpecificationExecutor<AccountDetails> {
    List<AccountDetails> findByChartOfAccountId(Long chartOfAccountId);
    Optional<AccountDetails> findByAccountDetailsCode(String accountDetailsCode);
    Page<AccountDetails> findByBranchId(Long branchId, Pageable pageable);
    List<AccountDetails> findByBranchIdAndChartOfAccountId(Long branchId, Long chartOfAccountId);
    Optional<AccountDetails> findByBranchIdAndGlPurpose(Long branchId, GlPurpose glPurpose);
}

package com.appGate.account.repository;

import com.appGate.account.models.AccountDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface AccountDetailsRepository extends JpaRepository<AccountDetails, Long>, JpaSpecificationExecutor<AccountDetails> {
    List<AccountDetails> findByChartOfAccountId(Long chartOfAccountId);
    Optional<AccountDetails> findByAccountDetailsCode(String accountDetailsCode);
}

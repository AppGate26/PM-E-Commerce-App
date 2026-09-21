package com.appGate.account.repository;

import com.appGate.account.models.ControlAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ControlAccountRepository extends JpaRepository<ControlAccount, Long>, JpaSpecificationExecutor<ControlAccount> {
    List<ControlAccount> findByAccountTypeId(Long accountTypeId);
    Optional<ControlAccount> findByControlId(String controlId);
}

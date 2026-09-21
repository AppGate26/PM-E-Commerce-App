package com.appGate.account.repository;

import com.appGate.account.models.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface AccountTypeRepository extends JpaRepository<AccountType, Long>, JpaSpecificationExecutor<AccountType> {
    Optional<AccountType> findByName(String name);
}

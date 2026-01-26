package com.appGate.account.repository;

import com.appGate.account.enums.AccountType;
import com.appGate.account.models.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByGlCode(String glCode);

    List<Account> findByAccountType(AccountType accountType);

    List<Account> findByClassId(Integer classId);

    List<Account> findByIsControlAccountTrue();

    List<Account> findByParentAccountId(Long parentAccountId);

    List<Account> findByIsActiveTrue();
}

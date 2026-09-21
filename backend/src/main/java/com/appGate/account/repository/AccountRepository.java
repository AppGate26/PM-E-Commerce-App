package com.appGate.account.repository;

import com.appGate.account.models.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByGlCode(String glCode);

    List<Account> findByAccountTypeId(Long accountTypeId);

    List<Account> findByClassId(Integer classId);

    List<Account> findByIsControlAccountTrue();

    List<Account> findByParentAccountId(Long parentAccountId);

    List<Account> findByIsActiveTrue();

    // --- Branch-visible chart of accounts ---
    // The chart is shared: a null branch id means the account is company-wide and
    // every branch sees it. A branch additionally sees accounts it created itself.

    @Query("SELECT a FROM Account a WHERE a.branchId IS NULL OR a.branchId = :branchId")
    List<Account> findVisibleToBranch(Long branchId);

    @Query("SELECT a FROM Account a WHERE a.isActive = true "
            + "AND (a.branchId IS NULL OR a.branchId = :branchId)")
    List<Account> findActiveVisibleToBranch(Long branchId);

    @Query("SELECT a FROM Account a WHERE a.accountTypeId = :accountTypeId "
            + "AND (a.branchId IS NULL OR a.branchId = :branchId)")
    List<Account> findByAccountTypeIdVisibleToBranch(Long accountTypeId, Long branchId);
}

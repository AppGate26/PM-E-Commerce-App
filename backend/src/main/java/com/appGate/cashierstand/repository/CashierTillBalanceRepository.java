package com.appGate.cashierstand.repository;

import com.appGate.cashierstand.models.CashierTillBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashierTillBalanceRepository extends JpaRepository<CashierTillBalance, Long> {

    List<CashierTillBalance> findByCashier(String cashier);

    Optional<CashierTillBalance> findByCashierAndTillBox(String cashier, String tillBox);

    // --- Branch-scoped ---
    // A till belongs to a cashier *at a branch*: the same person working two
    // branches keeps two separate tills.
    List<CashierTillBalance> findByCashierAndBranchId(String cashier, Long branchId);

    Optional<CashierTillBalance> findByCashierAndTillBoxAndBranchId(
            String cashier, String tillBox, Long branchId);
}

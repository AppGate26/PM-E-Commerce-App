package com.appGate.account.repository;

import com.appGate.account.models.CashierWalletFunding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CashierWalletFundingRepository extends JpaRepository<CashierWalletFunding, Long> {

    Optional<CashierWalletFunding> findByPaymentReference(String paymentReference);
}

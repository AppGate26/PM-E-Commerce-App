package com.appGate.staffpayroll.repository;

import com.appGate.staffpayroll.enums.SalaryComponentType;
import com.appGate.staffpayroll.models.PayrollAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollAccountRepository extends JpaRepository<PayrollAccount, Long> {
    Optional<PayrollAccount> findByComponentType(SalaryComponentType componentType);
    List<PayrollAccount> findAll();
}

package com.appGate.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.models.BankDetails;

public interface BankDetailsRepository  extends JpaRepository<BankDetails, Long>, JpaSpecificationExecutor<BankDetails>{
    BankDetails findByUserId(Long userId);
}

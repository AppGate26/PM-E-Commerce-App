package com.appGate.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.models.UtilityBill;

public interface UtilityBIllRepository extends JpaRepository<UtilityBill, Long>, JpaSpecificationExecutor<UtilityBill>{
    
}

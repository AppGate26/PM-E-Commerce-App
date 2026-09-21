package com.appGate.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.rbac.models.EmploymentInformation;

public interface EmploymentInformationRepository  extends JpaRepository<EmploymentInformation, Long>, JpaSpecificationExecutor<EmploymentInformation>{
    EmploymentInformation findByUserId(Long userId);
    
}

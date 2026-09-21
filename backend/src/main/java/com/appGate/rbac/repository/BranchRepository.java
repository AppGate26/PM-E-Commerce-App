package com.appGate.rbac.repository;

import com.appGate.rbac.enums.BranchStatusEnum;
import com.appGate.rbac.models.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long>, JpaSpecificationExecutor<Branch> {

    Optional<Branch> findByBranchCode(String branchCode);

    Optional<Branch> findByHeadOfficeTrue();

    List<Branch> findByStatus(BranchStatusEnum status);

    List<Branch> findByManagerId(Long managerId);
}

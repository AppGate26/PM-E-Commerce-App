package com.appGate.rbac.repository;

import com.appGate.rbac.enums.ApprovalStatus;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.models.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    List<ApprovalRequest> findByApprovalTypeAndStatus(ApprovalType approvalType, ApprovalStatus status);

    List<ApprovalRequest> findByStatus(ApprovalStatus status);

    List<ApprovalRequest> findByApprovalType(ApprovalType approvalType);

    List<ApprovalRequest> findByRequestedBy(Long userId);

    List<ApprovalRequest> findByEntityIdAndApprovalType(Long entityId, ApprovalType approvalType);
}

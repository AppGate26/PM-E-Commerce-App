package com.appGate.rbac.service;

import com.appGate.rbac.dto.ApprovalActionDto;
import com.appGate.rbac.dto.CreateApprovalRequestDto;
import com.appGate.rbac.enums.ApprovalStatus;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.models.ApprovalRequest;
import com.appGate.rbac.repository.ApprovalRequestRepository;
import com.appGate.rbac.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;

    @Transactional
    public BaseResponse createApprovalRequest(CreateApprovalRequestDto dto) {
        try {
            ApprovalRequest request = new ApprovalRequest();
            request.setApprovalType(dto.getApprovalType());
            request.setEntityId(dto.getEntityId());
            request.setRequestedBy(dto.getRequestedBy());
            request.setRequestData(dto.getRequestData());
            request.setComments(dto.getComments());
            request.setStatus(ApprovalStatus.PENDING);

            ApprovalRequest savedRequest = approvalRequestRepository.save(request);
            return new BaseResponse(HttpStatus.CREATED.value(), "Approval request created successfully", savedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating approval request: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllPendingApprovals() {
        List<ApprovalRequest> requests = approvalRequestRepository.findByStatus(ApprovalStatus.PENDING);
        return new BaseResponse(HttpStatus.OK.value(), "Pending approvals retrieved successfully", requests);
    }

    public BaseResponse getPendingApprovalsByType(ApprovalType approvalType) {
        List<ApprovalRequest> requests = approvalRequestRepository.findByApprovalTypeAndStatus(
                approvalType, ApprovalStatus.PENDING);
        return new BaseResponse(HttpStatus.OK.value(), "Pending approvals retrieved successfully", requests);
    }

    public BaseResponse getApprovalRequestById(Long id) {
        ApprovalRequest request = approvalRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Approval request retrieved successfully", request);
    }

    public BaseResponse getAllApprovalsByType(ApprovalType approvalType) {
        List<ApprovalRequest> requests = approvalRequestRepository.findByApprovalType(approvalType);
        return new BaseResponse(HttpStatus.OK.value(), "Approvals retrieved successfully", requests);
    }

    @Transactional
    public BaseResponse approveRequest(Long requestId, ApprovalActionDto dto) {
        try {
            ApprovalRequest request = approvalRequestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Approval request not found"));

            if (request.getStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Only pending requests can be approved", null);
            }

            request.setStatus(ApprovalStatus.APPROVED);
            request.setApprovedBy(dto.getApprovedBy());
            request.setComments(dto.getComments());
            request.setApprovedAt(LocalDateTime.now());

            ApprovalRequest updatedRequest = approvalRequestRepository.save(request);

            // Here you would trigger the actual action based on approval type
            // e.g., create the stock, customer, supplier, etc.
            processApprovedRequest(updatedRequest);

            return new BaseResponse(HttpStatus.OK.value(), "Request approved successfully", updatedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error approving request: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse declineRequest(Long requestId, ApprovalActionDto dto) {
        try {
            ApprovalRequest request = approvalRequestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Approval request not found"));

            if (request.getStatus() != ApprovalStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Only pending requests can be declined", null);
            }

            if (dto.getDeclineReason() == null || dto.getDeclineReason().isEmpty()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Decline reason is required", null);
            }

            request.setStatus(ApprovalStatus.DECLINED);
            request.setApprovedBy(dto.getApprovedBy());
            request.setDeclineReason(dto.getDeclineReason());
            request.setComments(dto.getComments());
            request.setApprovedAt(LocalDateTime.now());

            ApprovalRequest updatedRequest = approvalRequestRepository.save(request);

            return new BaseResponse(HttpStatus.OK.value(), "Request declined successfully", updatedRequest);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error declining request: " + e.getMessage(), null);
        }
    }

    private void processApprovedRequest(ApprovalRequest request) {
        // This method would contain logic to execute the approved action
        // based on the approval type
        // For example:
        // - STOCK_ADD: Create stock entry
        // - CUSTOMER_REGISTRATION: Activate customer account
        // - SUPPLIER_REGISTRATION: Create supplier
        // - etc.

        // The requestData field contains the JSON data needed to perform the action
        // You would parse this JSON and call the appropriate service methods

        // TODO: Implement specific processing logic for each approval type
    }
}

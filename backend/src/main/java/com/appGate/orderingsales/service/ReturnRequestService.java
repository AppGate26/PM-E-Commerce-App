package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.CreateReturnRequestDto;
import com.appGate.orderingsales.dto.RestoreReturnRequestDto;
import com.appGate.orderingsales.dto.UpdateReturnStatusDto;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.RefundMethod;
import com.appGate.orderingsales.enums.ReturnStatus;
import com.appGate.orderingsales.models.ReturnRequest;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.ReturnRequestRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.orderingsales.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReturnRequestService {

    private final ReturnRequestRepository returnRequestRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    // ==================== CREATE ====================

    @Transactional
    public BaseResponse createReturnRequest(CreateReturnRequestDto dto) {
        SalesOrder order = salesOrderRepository.findById(dto.getSalesOrderId())
                .orElseThrow(() -> new RuntimeException("Sales order not found"));
        // Refuse a return raised against another branch's sale.
        branchScopeService.assertCanAccess(order.getBranchId());

        if (order.getStatus() != OrderStatus.DELIVERED) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                    "Returns can only be requested for delivered orders", null);
        }

        if (dto.getRefundMethod() == RefundMethod.RECEIVE_OTHER_PRODUCT
                && dto.getReplacementProductId() == null) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                    "Replacement product ID is required when refund method is RECEIVE_OTHER_PRODUCT", null);
        }

        ReturnRequest returnRequest = new ReturnRequest();
        returnRequest.setSalesOrderId(order.getId());
        // The return belongs wherever the sale was booked, not wherever the clerk is.
        returnRequest.setBranchId(order.getBranchId());
        returnRequest.setReferenceNo(order.getReferenceNo());
        returnRequest.setCustomerId(order.getCustomerId());
        returnRequest.setCustomerName(order.getCustomerName());
        returnRequest.setReason(dto.getReason());
        returnRequest.setReturnMethod(dto.getReturnMethod());
        returnRequest.setRefundMethod(dto.getRefundMethod());
        returnRequest.setReplacementProductId(dto.getReplacementProductId());
        returnRequest.setReplacementProductName(dto.getReplacementProductName());
        returnRequest.setStatus(ReturnStatus.PENDING);

        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return new BaseResponse(HttpStatus.CREATED.value(), "Return request submitted successfully", saved);
    }

    // ==================== RETRIEVAL ====================

    public BaseResponse getById(Long id) {
        ReturnRequest returnRequest = returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        branchScopeService.assertCanAccess(returnRequest.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "successful", returnRequest);
    }

    public BaseResponse getByCustomer(Long customerId, int page, int size) {
        Page<ReturnRequest> results = returnRequestRepository.findByCustomerId(
                customerId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return new BaseResponse(HttpStatus.OK.value(), "successful", results);
    }

    public BaseResponse getByOrder(Long salesOrderId, int page, int size) {
        Page<ReturnRequest> results = returnRequestRepository.findBySalesOrderId(
                salesOrderId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return new BaseResponse(HttpStatus.OK.value(), "successful", results);
    }

    public BaseResponse getByStatus(ReturnStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long branchId = branchScopeService.getScopedBranchId();
        Page<ReturnRequest> results = branchId == null
                ? returnRequestRepository.findByStatus(status, pageable)
                : returnRequestRepository.findByStatusAndBranchId(status, branchId, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", results);
    }

    public BaseResponse getAll(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long branchId = branchScopeService.getScopedBranchId();
        Page<ReturnRequest> results = branchId == null
                ? returnRequestRepository.findAll(pageable)
                : returnRequestRepository.findByBranchId(branchId, pageable);
        return new BaseResponse(HttpStatus.OK.value(), "successful", results);
    }

    // ==================== STATUS MANAGEMENT ====================

    @Transactional
    public BaseResponse updateStatus(Long id, UpdateReturnStatusDto dto) {
        ReturnRequest returnRequest = returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        branchScopeService.assertCanAccess(returnRequest.getBranchId());

        returnRequest.setStatus(dto.getStatus());
        returnRequest.setAdminNotes(dto.getAdminNotes());
        returnRequest.setReviewedBy(dto.getReviewedBy());
        returnRequest.setReviewedAt(LocalDateTime.now());

        if (dto.getStatus() == ReturnStatus.COMPLETED) {
            returnRequest.setCompletedAt(LocalDateTime.now());
        }

        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return new BaseResponse(HttpStatus.OK.value(), "Return request updated successfully", saved);
    }

    // ==================== RESTORATION ====================

    @Transactional
    public BaseResponse restoreReturn(Long id, RestoreReturnRequestDto dto) {
        ReturnRequest returnRequest = returnRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Return request not found"));
        branchScopeService.assertCanAccess(returnRequest.getBranchId());

        if (returnRequest.getStatus() != ReturnStatus.COMPLETED) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                    "Only completed returns can be restored", null);
        }

        returnRequest.setRestorationReceivedAt(dto.getRestorationReceivedAt());
        returnRequest.setRestorationCompletedAt(dto.getRestorationCompletedAt());
        returnRequest.setRestorationDescription(dto.getRestorationDescription());
        returnRequest.setStatus(ReturnStatus.RESTORED);

        ReturnRequest saved = returnRequestRepository.save(returnRequest);
        return new BaseResponse(HttpStatus.OK.value(), "Return request restored successfully", saved);
    }
}

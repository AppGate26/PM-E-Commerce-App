package com.appGate.rbac.controller;

import com.appGate.rbac.dto.ApprovalActionDto;
import com.appGate.rbac.dto.CreateApprovalRequestDto;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.ApprovalService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/approvals")
@RequiredArgsConstructor
@Tag(name = "Admin - Approval System", description = "Centralized approval system for stocks, sales, customers, suppliers, etc.")
public class ApprovalController {

    private final ApprovalService approvalService;

    // ==================== GENERIC APPROVAL ENDPOINTS ====================

    @Operation(summary = "Create approval request", description = "Create a new approval request for any approval type")
    @PostMapping
    public BaseResponse createApprovalRequest(@Valid @RequestBody CreateApprovalRequestDto dto) {
        return approvalService.createApprovalRequest(dto);
    }

    @Operation(summary = "Get all pending approvals", description = "Retrieve all pending approval requests across all types")
    @GetMapping("/pending")
    public BaseResponse getAllPendingApprovals() {
        return approvalService.getAllPendingApprovals();
    }

    @Operation(summary = "Get approval request by ID", description = "Retrieve specific approval request details")
    @GetMapping("/{id}")
    public BaseResponse getApprovalRequestById(@PathVariable Long id) {
        return approvalService.getApprovalRequestById(id);
    }

    @Operation(summary = "Approve request", description = "Approve a pending approval request")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<BaseResponse> approveRequest(@PathVariable Long id, @Valid @RequestBody ApprovalActionDto dto) {
        BaseResponse response = approvalService.approveRequest(id, dto);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @Operation(summary = "Decline request", description = "Decline a pending approval request with reason")
    @PatchMapping("/{id}/decline")
    public ResponseEntity<BaseResponse> declineRequest(@PathVariable Long id, @Valid @RequestBody ApprovalActionDto dto) {
        BaseResponse response = approvalService.declineRequest(id, dto);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    // ==================== STOCK ADDITION APPROVAL ====================

    @Operation(summary = "Get pending stock additions", description = "Retrieve all pending stock addition requests")
    @GetMapping("/stock/pending")
    public BaseResponse getPendingStockAdditions() {
        return approvalService.getPendingApprovalsByType(ApprovalType.STOCK_ADD);
    }

    @Operation(summary = "Get all stock approvals", description = "Retrieve all stock addition approval requests")
    @GetMapping("/stock")
    public BaseResponse getAllStockApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.STOCK_ADD);
    }

    // ==================== CREDIT SALES APPROVAL ====================

    @Operation(summary = "Get pending credit sales", description = "Retrieve all pending credit sales approval requests")
    @GetMapping("/credit-sales/pending")
    public BaseResponse getPendingCreditSales() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CREDIT_SALES);
    }

    @Operation(summary = "Get all credit sales approvals", description = "Retrieve all credit sales approval requests")
    @GetMapping("/credit-sales")
    public BaseResponse getAllCreditSalesApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CREDIT_SALES);
    }

    // ==================== CASH SALES APPROVAL ====================

    @Operation(summary = "Get pending cash sales", description = "Retrieve all pending cash sales approval requests")
    @GetMapping("/cash-sales/pending")
    public BaseResponse getPendingCashSales() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CASH_SALES);
    }

    @Operation(summary = "Get all cash sales approvals", description = "Retrieve all cash sales approval requests")
    @GetMapping("/cash-sales")
    public BaseResponse getAllCashSalesApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CASH_SALES);
    }

    // ==================== CUSTOMER REGISTRATION APPROVAL ====================

    @Operation(summary = "Get pending customer registrations", description = "Retrieve all pending customer registration requests")
    @GetMapping("/customers/pending")
    public BaseResponse getPendingCustomerRegistrations() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CUSTOMER_REGISTRATION);
    }

    @Operation(summary = "Get all customer approvals", description = "Retrieve all customer registration approval requests")
    @GetMapping("/customers")
    public BaseResponse getAllCustomerApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CUSTOMER_REGISTRATION);
    }

    // ==================== GOODS SUPPLIED APPROVAL ====================

    @Operation(summary = "Get pending goods supplied", description = "Retrieve all pending goods supplied approval requests")
    @GetMapping("/goods-supplied/pending")
    public BaseResponse getPendingGoodsSupplied() {
        return approvalService.getPendingApprovalsByType(ApprovalType.GOODS_SUPPLIED);
    }

    @Operation(summary = "Get all goods supplied approvals", description = "Retrieve all goods supplied approval requests")
    @GetMapping("/goods-supplied")
    public BaseResponse getAllGoodsSuppliedApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.GOODS_SUPPLIED);
    }

    // ==================== STOCK DELETE APPROVAL ====================

    @Operation(summary = "Get pending stock deletions", description = "Retrieve all pending stock deletion requests")
    @GetMapping("/stock-delete/pending")
    public BaseResponse getPendingStockDeletions() {
        return approvalService.getPendingApprovalsByType(ApprovalType.STOCK_DELETE);
    }

    @Operation(summary = "Get all stock delete approvals", description = "Retrieve all stock deletion approval requests")
    @GetMapping("/stock-delete")
    public BaseResponse getAllStockDeleteApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.STOCK_DELETE);
    }

    // ==================== SUPPLIER REGISTRATION APPROVAL ====================

    @Operation(summary = "Get pending supplier registrations", description = "Retrieve all pending supplier registration requests")
    @GetMapping("/suppliers/pending")
    public BaseResponse getPendingSupplierRegistrations() {
        return approvalService.getPendingApprovalsByType(ApprovalType.SUPPLIER_REGISTRATION);
    }

    @Operation(summary = "Get all supplier approvals", description = "Retrieve all supplier registration approval requests")
    @GetMapping("/suppliers")
    public BaseResponse getAllSupplierApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.SUPPLIER_REGISTRATION);
    }

    // ==================== CUSTOMER SUSPENSION APPROVAL ====================

    @Operation(summary = "Get pending customer suspensions", description = "Retrieve all pending customer suspension requests")
    @GetMapping("/suspensions/pending")
    public BaseResponse getPendingCustomerSuspensions() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CUSTOMER_SUSPENSION);
    }

    @Operation(summary = "Get all suspension approvals", description = "Retrieve all customer suspension approval requests")
    @GetMapping("/suspensions")
    public BaseResponse getAllSuspensionApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CUSTOMER_SUSPENSION);
    }

    // ==================== CUSTOMER UNBLOCK APPROVAL ====================

    @Operation(summary = "Get pending customer unblocks", description = "Retrieve all pending customer unblock requests")
    @GetMapping("/unblocks/pending")
    public BaseResponse getPendingCustomerUnblocks() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CUSTOMER_UNBLOCK);
    }

    @Operation(summary = "Get all unblock approvals", description = "Retrieve all customer unblock approval requests")
    @GetMapping("/unblocks")
    public BaseResponse getAllUnblockApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CUSTOMER_UNBLOCK);
    }

    // ==================== JOURNAL ENTRY APPROVAL ====================

    @Operation(summary = "Get pending journal entries", description = "Retrieve all pending journal entry approval requests")
    @GetMapping("/journal/pending")
    public BaseResponse getPendingJournalEntries() {
        return approvalService.getPendingApprovalsByType(ApprovalType.JOURNAL_ENTRY);
    }

    @Operation(summary = "Get all journal approvals", description = "Retrieve all journal entry approval requests")
    @GetMapping("/journal")
    public BaseResponse getAllJournalApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.JOURNAL_ENTRY);
    }

    // ==================== CUSTOMER EDIT APPROVAL ====================

    @Operation(summary = "Get pending customer edits", description = "Retrieve all pending customer edit approval requests")
    @GetMapping("/customer-edit/pending")
    public BaseResponse getPendingCustomerEdits() {
        return approvalService.getPendingApprovalsByType(ApprovalType.CUSTOMER_EDIT);
    }

    @Operation(summary = "Get all customer edit approvals", description = "Retrieve all customer edit approval requests")
    @GetMapping("/customer-edit")
    public BaseResponse getAllCustomerEditApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.CUSTOMER_EDIT);
    }

    // ==================== PRODUCT TO WAREHOUSE APPROVAL ====================

    @Operation(summary = "Get pending product to warehouse movements", description = "Retrieve all pending product to warehouse approval requests")
    @GetMapping("/product-to-warehouse/pending")
    public BaseResponse getPendingProductToWarehouseMovements() {
        return approvalService.getPendingApprovalsByType(ApprovalType.PRODUCT_TO_WAREHOUSE);
    }

    @Operation(summary = "Get all product to warehouse approvals", description = "Retrieve all product to warehouse approval requests")
    @GetMapping("/product-to-warehouse")
    public BaseResponse getAllProductToWarehouseApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.PRODUCT_TO_WAREHOUSE);
    }

    // ==================== REFUND APPROVAL ====================

    @Operation(summary = "Get pending refunds", description = "Retrieve all pending refund approval requests")
    @GetMapping("/refund/pending")
    public BaseResponse getPendingRefunds() {
        return approvalService.getPendingApprovalsByType(ApprovalType.REFUND);
    }

    @Operation(summary = "Get all refund approvals", description = "Retrieve all refund approval requests")
    @GetMapping("/refund")
    public BaseResponse getAllRefundApprovals() {
        return approvalService.getAllApprovalsByType(ApprovalType.REFUND);
    }
}

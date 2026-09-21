package com.appGate.inventory.service;

import com.appGate.inventory.dto.SupplierLedgerDto;
import com.appGate.inventory.dto.SupplierPaymentDto;
import com.appGate.inventory.models.SupplierPayment;
import com.appGate.inventory.repository.SupplierPaymentRepository;
import com.appGate.inventory.repository.SupplierRepository;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.rbac.dto.CreateApprovalRequestDto;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

// Records money actually paid to a supplier (reducing what the business owes them),
// mirroring GoodsSuppliedService's "save record -> file approval -> post ledger entry"
// pattern - the goods-supplied side already posts a DEBIT to SupplierLedger whenever
// goods are received; this is its counterpart CREDIT for when the supplier is paid.
// Previously there was no dedicated way to record this at all - only a generic,
// free-text "Add ledger entry" form buried in the Supplier Ledger screen with no
// invoice-linking, no payment method/reference capture, and no approval trail.
@Service
@RequiredArgsConstructor
public class SupplierPaymentService {

    private final SupplierPaymentRepository supplierPaymentRepository;
    private final SupplierRepository supplierRepository;
    private final ApprovalService approvalService;
    private final SupplierLedgerService supplierLedgerService;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    @Transactional
    public BaseResponse recordSupplierPayment(SupplierPaymentDto dto) {
        supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));

        try {
            SupplierPayment payment = new SupplierPayment();
            payment.setSupplierId(dto.getSupplierId());
            payment.setAmountPaid(dto.getAmountPaid());
            payment.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : LocalDate.now());
            payment.setPaymentMethod(dto.getPaymentMethod());
            payment.setPaymentReference(dto.getPaymentReference());
            payment.setInvoiceNumber(dto.getInvoiceNumber());
            payment.setNotes(dto.getNotes());

            SupplierPayment savedPayment = supplierPaymentRepository.save(payment);

            // Create a PENDING approval record so it appears in the approval workspace
            // for oversight, same as goods-supplied - this doesn't gate the ledger post
            // below (the money has already left the business by the time it's recorded
            // here, same reasoning as goods-supplied recording an already-delivered
            // shipment), it's an audit trail.
            CreateApprovalRequestDto approvalDto = new CreateApprovalRequestDto();
            approvalDto.setApprovalType(ApprovalType.SUPPLIER_PAYMENT);
            approvalDto.setEntityId(savedPayment.getId());
            approvalDto.setRequestedBy(0L);
            approvalDto.setRequestData(String.format(
                    "{\"supplierId\":%d,\"amountPaid\":%s,\"paymentReference\":\"%s\"}",
                    savedPayment.getSupplierId(),
                    savedPayment.getAmountPaid() != null ? savedPayment.getAmountPaid().toString() : "0",
                    savedPayment.getPaymentReference() != null ? savedPayment.getPaymentReference() : ""
            ));
            approvalDto.setComments("Supplier payment pending approval");
            approvalService.createApprovalRequest(approvalDto);

            postSupplierLedgerCredit(savedPayment);

            return new BaseResponse(HttpStatus.CREATED.value(), "Supplier payment recorded successfully", savedPayment);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error recording supplier payment: " + e.getMessage(), null);
        }
    }

    // A payment made to the supplier reduces what we owe them, so this is a credit
    // (balance = prev + debit - credit) - see SupplierLedgerService.addLedgerEntry.
    private void postSupplierLedgerCredit(SupplierPayment payment) {
        BigDecimal amount = payment.getAmountPaid() != null ? payment.getAmountPaid() : BigDecimal.ZERO;
        SupplierLedgerDto ledger = new SupplierLedgerDto();
        ledger.setSupplierId(payment.getSupplierId());
        ledger.setTransactionDate(payment.getPaymentDate());
        ledger.setDescription("Supplier payment"
                + (payment.getPaymentMethod() != null ? " - " + payment.getPaymentMethod() : ""));
        ledger.setReferenceNo(payment.getPaymentReference() != null
                ? payment.getPaymentReference() : "SP-" + payment.getId());
        ledger.setTransactionType("PAYMENT");
        ledger.setDebit(BigDecimal.ZERO);
        ledger.setCredit(amount);
        supplierLedgerService.addLedgerEntry(ledger);
    }

    public BaseResponse getAllSupplierPayments() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<SupplierPayment> payments = branchId == null
                ? supplierPaymentRepository.findAll()
                : supplierPaymentRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier payments retrieved successfully", payments);
    }

    public BaseResponse getSupplierPaymentsBySupplier(Long supplierId) {
        List<SupplierPayment> payments = supplierPaymentRepository.findBySupplierIdOrderByPaymentDateDesc(supplierId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier payment history retrieved successfully", payments);
    }
}

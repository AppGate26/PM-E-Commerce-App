package com.appGate.inventory.service;

import com.appGate.inventory.dto.GoodsSuppliedDto;
import com.appGate.inventory.dto.SupplierLedgerDto;
import com.appGate.inventory.models.GoodsSupplied;
import com.appGate.inventory.repository.GoodsSuppliedRepository;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.rbac.dto.CreateApprovalRequestDto;
import com.appGate.rbac.enums.ApprovalType;
import com.appGate.rbac.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoodsSuppliedService {

    private final GoodsSuppliedRepository goodsSuppliedRepository;
    private final ApprovalService approvalService;
    private final SupplierLedgerService supplierLedgerService;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    @Transactional
    public BaseResponse recordGoodsSupplied(GoodsSuppliedDto dto) {
        try {
            GoodsSupplied goods = new GoodsSupplied();
            goods.setSupplierId(dto.getSupplierId());
            goods.setProductId(dto.getProductId());
            goods.setSuppliedProduct(dto.getSuppliedProduct());
            goods.setUnitPrice(dto.getUnitPrice());
            goods.setDeliveryFee(dto.getDeliveryFee());
            goods.setTotalAmount(dto.getTotalAmount());
            goods.setDateSupplied(dto.getDateSupplied());
            goods.setVehicleNumber(dto.getVehicleNumber());
            goods.setInvoiceNumber(dto.getInvoiceNumber());
            goods.setLpoNumber(dto.getLpoNumber());
            goods.setWaybillNumber(dto.getWaybillNumber());
            goods.setWarehouseName(dto.getWarehouseName());
            goods.setGlDebitCode(dto.getGlDebitCode());
            goods.setGlCreditCode(dto.getGlCreditCode());
            goods.setTerminalCode(dto.getTerminalCode());

            GoodsSupplied savedGoods = goodsSuppliedRepository.save(goods);

            // Create a PENDING approval record so it appears in the approval workspace
            CreateApprovalRequestDto approvalDto = new CreateApprovalRequestDto();
            approvalDto.setApprovalType(ApprovalType.GOODS_SUPPLIED);
            approvalDto.setEntityId(savedGoods.getId());
            approvalDto.setRequestedBy(dto.getSupplierId() != null ? dto.getSupplierId() : 0L);
            approvalDto.setRequestData(String.format(
                    "{\"invoiceNumber\":\"%s\",\"suppliedProduct\":\"%s\",\"supplierId\":%d,\"totalAmount\":%s}",
                    savedGoods.getInvoiceNumber() != null ? savedGoods.getInvoiceNumber() : "",
                    savedGoods.getSuppliedProduct() != null ? savedGoods.getSuppliedProduct() : "",
                    savedGoods.getSupplierId() != null ? savedGoods.getSupplierId() : 0,
                    savedGoods.getTotalAmount() != null ? savedGoods.getTotalAmount().toString() : "0"
            ));
            approvalDto.setComments("Goods supplied pending approval");
            approvalService.createApprovalRequest(approvalDto);

            // Post to the supplier ledger so activity shows up automatically. Goods received
            // increase what we owe the supplier, so this is a debit (balance = prev + debit - credit).
            postSupplierLedgerDebit(savedGoods);

            return new BaseResponse(HttpStatus.CREATED.value(), "Goods supplied recorded successfully", savedGoods);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error recording goods supplied: " + e.getMessage(), null);
        }
    }

    // Record a supplier-ledger debit for a goods-supplied record. Best-effort: a ledger
    // failure (e.g. supplier not found) must not roll back the goods record itself.
    private void postSupplierLedgerDebit(GoodsSupplied goods) {
        if (goods.getSupplierId() == null) return;
        BigDecimal amount = goods.getTotalAmount() != null ? goods.getTotalAmount() : BigDecimal.ZERO;
        try {
            SupplierLedgerDto ledger = new SupplierLedgerDto();
            ledger.setSupplierId(goods.getSupplierId());
            ledger.setTransactionDate(goods.getDateSupplied());
            ledger.setDescription("Goods supplied"
                    + (goods.getSuppliedProduct() != null ? " - " + goods.getSuppliedProduct() : ""));
            ledger.setReferenceNo(goods.getInvoiceNumber() != null
                    ? goods.getInvoiceNumber()
                    : (goods.getWaybillNumber() != null ? goods.getWaybillNumber() : "GS-" + goods.getId()));
            ledger.setTransactionType("GOODS_SUPPLIED");
            ledger.setDebit(amount);
            ledger.setCredit(BigDecimal.ZERO);
            supplierLedgerService.addLedgerEntry(ledger);
        } catch (Exception ignored) {
            // Supplier not found or other ledger issue — leave the goods record intact.
        }
    }

    public BaseResponse getAllGoodsSupplied() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<GoodsSupplied> goodsList = branchId == null
                ? goodsSuppliedRepository.findAll()
                : goodsSuppliedRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Goods supplied records retrieved successfully", goodsList);
    }

    public BaseResponse getGoodsSuppliedById(Long id) {
        GoodsSupplied goods = goodsSuppliedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goods supplied record not found"));
        branchScopeService.assertCanAccess(goods.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Goods supplied record retrieved successfully", goods);
    }

    public BaseResponse getGoodsSuppliedBySupplier(Long supplierId) {
        List<GoodsSupplied> goodsList = goodsSuppliedRepository.findBySupplierId(supplierId);
        return new BaseResponse(HttpStatus.OK.value(), "Supplier goods supplied records retrieved successfully", goodsList);
    }

    public BaseResponse getGoodsSuppliedByProduct(Long productId) {
        List<GoodsSupplied> goodsList = goodsSuppliedRepository.findByProductId(productId);
        return new BaseResponse(HttpStatus.OK.value(), "Product supply records retrieved successfully", goodsList);
    }

    @Transactional
    public BaseResponse updateGoodsSupplied(Long id, GoodsSuppliedDto dto) {
        try {
            GoodsSupplied goods = goodsSuppliedRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Goods supplied record not found"));

            if (dto.getSuppliedProduct() != null) {
                goods.setSuppliedProduct(dto.getSuppliedProduct());
            }
            if (dto.getUnitPrice() != null) {
                goods.setUnitPrice(dto.getUnitPrice());
            }
            if (dto.getDeliveryFee() != null) {
                goods.setDeliveryFee(dto.getDeliveryFee());
            }
            if (dto.getTotalAmount() != null) {
                goods.setTotalAmount(dto.getTotalAmount());
            }
            if (dto.getDateSupplied() != null) {
                goods.setDateSupplied(dto.getDateSupplied());
            }
            if (dto.getVehicleNumber() != null) {
                goods.setVehicleNumber(dto.getVehicleNumber());
            }
            if (dto.getInvoiceNumber() != null) {
                goods.setInvoiceNumber(dto.getInvoiceNumber());
            }
            if (dto.getLpoNumber() != null) {
                goods.setLpoNumber(dto.getLpoNumber());
            }
            if (dto.getWaybillNumber() != null) {
                goods.setWaybillNumber(dto.getWaybillNumber());
            }
            if (dto.getWarehouseName() != null) {
                goods.setWarehouseName(dto.getWarehouseName());
            }
            if (dto.getGlDebitCode() != null) {
                goods.setGlDebitCode(dto.getGlDebitCode());
            }
            if (dto.getGlCreditCode() != null) {
                goods.setGlCreditCode(dto.getGlCreditCode());
            }
            if (dto.getTerminalCode() != null) {
                goods.setTerminalCode(dto.getTerminalCode());
            }

            GoodsSupplied updatedGoods = goodsSuppliedRepository.save(goods);
            return new BaseResponse(HttpStatus.OK.value(), "Goods supplied record updated successfully", updatedGoods);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating goods supplied record: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteGoodsSupplied(Long id) {
        try {
            GoodsSupplied goods = goodsSuppliedRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Goods supplied record not found"));
            goodsSuppliedRepository.delete(goods);
            return new BaseResponse(HttpStatus.OK.value(), "Goods supplied record deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting goods supplied record: " + e.getMessage(), null);
        }
    }
}

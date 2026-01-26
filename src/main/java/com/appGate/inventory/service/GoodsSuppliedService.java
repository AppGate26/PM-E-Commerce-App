package com.appGate.inventory.service;

import com.appGate.inventory.dto.GoodsSuppliedDto;
import com.appGate.inventory.models.GoodsSupplied;
import com.appGate.inventory.repository.GoodsSuppliedRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoodsSuppliedService {

    private final GoodsSuppliedRepository goodsSuppliedRepository;

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
            goods.setTerminalCode(dto.getTerminalCode());

            GoodsSupplied savedGoods = goodsSuppliedRepository.save(goods);
            return new BaseResponse(HttpStatus.CREATED.value(), "Goods supplied recorded successfully", savedGoods);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error recording goods supplied: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllGoodsSupplied() {
        List<GoodsSupplied> goodsList = goodsSuppliedRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Goods supplied records retrieved successfully", goodsList);
    }

    public BaseResponse getGoodsSuppliedById(Long id) {
        GoodsSupplied goods = goodsSuppliedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goods supplied record not found"));
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

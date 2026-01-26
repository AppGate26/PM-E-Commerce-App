package com.appGate.inventory.controller;

import com.appGate.inventory.dto.GoodsSuppliedDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.GoodsSuppliedService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/goods-supplied")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - Goods Supplied", description = "Track goods delivered by suppliers")
public class GoodsSuppliedController {

    private final GoodsSuppliedService goodsSuppliedService;

    @Operation(summary = "Record goods supplied", description = "Record new goods delivered by supplier with vehicle, invoice, and waybill details")
    @PostMapping
    public BaseResponse recordGoodsSupplied(@Valid @RequestBody GoodsSuppliedDto dto) {
        return goodsSuppliedService.recordGoodsSupplied(dto);
    }

    @Operation(summary = "Get all goods supplied records", description = "Retrieve all goods supplied records across all suppliers")
    @GetMapping
    public BaseResponse getAllGoodsSupplied() {
        return goodsSuppliedService.getAllGoodsSupplied();
    }

    @Operation(summary = "Get goods supplied by ID", description = "Retrieve a specific goods supplied record by ID")
    @GetMapping("/{id}")
    public BaseResponse getGoodsSuppliedById(@PathVariable Long id) {
        return goodsSuppliedService.getGoodsSuppliedById(id);
    }

    @Operation(summary = "Get goods supplied by supplier", description = "Retrieve all goods supplied by a specific supplier")
    @GetMapping("/supplier/{supplierId}")
    public BaseResponse getGoodsSuppliedBySupplier(@PathVariable Long supplierId) {
        return goodsSuppliedService.getGoodsSuppliedBySupplier(supplierId);
    }

    @Operation(summary = "Get goods supplied by product", description = "Retrieve supply history for a specific product")
    @GetMapping("/product/{productId}")
    public BaseResponse getGoodsSuppliedByProduct(@PathVariable Long productId) {
        return goodsSuppliedService.getGoodsSuppliedByProduct(productId);
    }

    @Operation(summary = "Update goods supplied record", description = "Update an existing goods supplied record")
    @PutMapping("/{id}")
    public BaseResponse updateGoodsSupplied(@PathVariable Long id, @Valid @RequestBody GoodsSuppliedDto dto) {
        return goodsSuppliedService.updateGoodsSupplied(id, dto);
    }

    @Operation(summary = "Delete goods supplied record", description = "Delete a goods supplied record from the system")
    @DeleteMapping("/{id}")
    public BaseResponse deleteGoodsSupplied(@PathVariable Long id) {
        return goodsSuppliedService.deleteGoodsSupplied(id);
    }
}

package com.appGate.inventory.controller;

import com.appGate.inventory.dto.SupplierDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.SupplierService;

import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api")
@Tag(name = "Inventory Management - Supplier", description = "Products, categories, stock, and suppliers")
public class SupplierController {

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    private final SupplierService supplierService;

    @PostMapping("/users/suppliers")
    public BaseResponse createSupplier(@RequestBody SupplierDto supplierDto) {
        return supplierService.createSupplier(supplierDto);
    }

    @GetMapping("/users/suppliers")
    public BaseResponse getAllsuppliers() {
        return supplierService.getAllSuppliers();
    }

    @GetMapping("/users/suppliers/{id}")
    public BaseResponse getSupplier(@PathVariable Long id) {
        return supplierService.getSupplier(id);
    }

    @PutMapping("/users/suppliers/{id}")
    public BaseResponse updateSupplier(@PathVariable Long id, @RequestBody SupplierDto SupplierDto) {
        return supplierService.updateSupplier(id, SupplierDto);
    }
}

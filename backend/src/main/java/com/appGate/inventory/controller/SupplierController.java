package com.appGate.inventory.controller;

import com.appGate.inventory.dto.SupplierDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.SupplierService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api")
@Tag(name = "Inventory Management - Supplier", description = "Products, categories, stock, and suppliers")
public class SupplierController {

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    private final SupplierService supplierService;

    @Operation(summary = "Create supplier", description = "Create new supplier with optional passport image upload")
    @PostMapping(value = "/users/suppliers", consumes = "multipart/form-data")
    public BaseResponse createSupplier(
            @Valid @ModelAttribute SupplierDto supplierDto,
            HttpServletRequest request) {
        return supplierService.createSupplier(supplierDto, request);
    }

    @Operation(summary = "Get all suppliers", description = "Retrieve all suppliers in the system")
    @GetMapping("/users/suppliers")
    public BaseResponse getAllsuppliers() {
        return supplierService.getAllSuppliers();
    }

    @Operation(summary = "Get supplier by ID", description = "Retrieve a specific supplier by ID")
    @GetMapping("/users/suppliers/{id}")
    public BaseResponse getSupplier(@PathVariable Long id) {
        return supplierService.getSupplier(id);
    }

    @Operation(summary = "Update supplier", description = "Update supplier details including passport image")
    @PutMapping(value = "/users/suppliers/{id}", consumes = "multipart/form-data")
    public BaseResponse updateSupplier(
            @PathVariable Long id,
            @Valid @ModelAttribute SupplierDto SupplierDto,
            HttpServletRequest request) {
        return supplierService.updateSupplier(id, SupplierDto, request);
    }
}

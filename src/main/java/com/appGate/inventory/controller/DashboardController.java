package com.appGate.inventory.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.ProductService;
import com.appGate.inventory.service.SubCategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping(path = "/api")
@Tag(name = "Inventory Management - Dashboard", description = "Products, categories, stock, and suppliers")
public class DashboardController {

    private final ProductService productService;
    private final SubCategoryService subCategoryService;

    public DashboardController(ProductService productService, SubCategoryService subCategoryService) {
        this.productService = productService;
        this.subCategoryService = subCategoryService;
    }

    @GetMapping("/users/quick-pick")
    public BaseResponse quickPick() {
        return productService.quickPick();
    }

    @GetMapping("/users/popular-products-today")
    public BaseResponse popularProductsToday() {
        return productService.getPopularProductsToday();
    }

    @GetMapping("/users/products-by-sub-category/{subCategoryId}")
    public BaseResponse productsBySubCategory(@PathVariable Long subCategoryId) {
        return subCategoryService.getProductsBySubCategory(subCategoryId);
    }

}

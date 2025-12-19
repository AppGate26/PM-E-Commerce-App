package com.appGate.inventory.controller;

import org.springframework.web.bind.annotation.*;

import com.appGate.inventory.dto.CategoryDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.CategoryService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping(path = "/api")
@Tag(name = "Inventory Management - category", description = "Products, categories, stock, and suppliers")
public class CategoryController {

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private final CategoryService categoryService;

    @PostMapping("/admin/categories")
    public BaseResponse createCategory(@RequestBody CategoryDto categoryDto) {
        return categoryService.createCategory(categoryDto);
    }

    @GetMapping("/admin/categories")
    public BaseResponse getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/admin/categories/{id}")
    public BaseResponse getCategory(@PathVariable Long id) {
        return categoryService.getCategory(id);
    }

    @PutMapping("/admin/categories/{id}")
    public BaseResponse updateCategory(@PathVariable Long id, @RequestBody CategoryDto categoryDto) {
        return categoryService.updateCategory(id, categoryDto);
    }

    @DeleteMapping("/admin/categories/{id}")
    public BaseResponse deleteCategory(@PathVariable Long id) {
        return categoryService.deleteCategory(id);
    }
}

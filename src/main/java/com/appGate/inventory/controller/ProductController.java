package com.appGate.inventory.controller;

import com.appGate.inventory.dto.ProductDto;
import com.appGate.inventory.response.BaseResponse;
import com.appGate.inventory.service.ProductService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping(path = "/api")
@RequiredArgsConstructor
@Tag(name = "Inventory Management - product", description = "Products, categories, stock, and suppliers")
public class ProductController {

    private final ProductService productService;

    /**
     * Create a new product (Admin only)
     * POST /api/admin/products
     */
    @PostMapping(value = "/admin/products", consumes = "multipart/form-data")
    public BaseResponse createProduct(
            @Valid @ModelAttribute ProductDto productDto,
            HttpServletRequest request) {
        return productService.createProduct(productDto, request);
    }

    /**
     * Get a single product by ID
     * GET /api/products/{productId}
     */
    @GetMapping("/products/{productId}")
    public BaseResponse getProduct(@PathVariable Long productId) {
        return productService.getAProduct(productId);
    }

    /**
     * Get all products with pagination and sorting
     * GET /api/products?page=0&size=20&sortBy=id&sortDirection=asc
     */
    @GetMapping("/products")
    public BaseResponse getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        return productService.getAllProductsPaginated(page, size, sortBy, sortDirection);
    }

    /**
     * Get products by category with pagination
     * GET /api/products/category/{categoryId}?page=0&size=20
     */
    @GetMapping("/products/category/{categoryId}")
    public BaseResponse getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getProductsByCategory(categoryId, page, size);
    }

    /**
     * Search products by name
     * GET /api/products/search?query=iphone&page=0&size=20
     */
    @GetMapping("/products/search")
    public BaseResponse searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.searchProducts(query, page, size);
    }

    /**
     * Filter products by price range
     * GET /api/products/filter/price?minPrice=10000&maxPrice=50000&page=0&size=20
     */
    @GetMapping("/products/filter/price")
    public BaseResponse filterByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.filterProductsByPriceRange(minPrice, maxPrice, page, size);
    }

    /**
     * Update a product (Admin only)
     * PUT /api/admin/products/{productId}
     */
    @PutMapping(value = "/admin/products/{productId}", consumes = "multipart/form-data")
    public BaseResponse updateProduct(
            @PathVariable Long productId,
            @Valid @ModelAttribute ProductDto productDto,
            HttpServletRequest request) {
        // Note: editProduct in ProductService needs to be updated to handle HttpServletRequest
        return productService.editProduct(productId, productDto);
    }

    /**
     * Delete a product (Admin only)
     * DELETE /api/admin/products/{productId}
     */
    @DeleteMapping("/admin/products/{productId}")
    public BaseResponse deleteProduct(@PathVariable Long productId) {
        try {
            productService.deleteProduct(productId);
            return new BaseResponse(HttpStatus.OK.value(), "Product deleted successfully", null);
        } catch (IOException e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Failed to delete product: " + e.getMessage(), null);
        }
    }

    /**
     * Get product image
     * GET /api/products/images/**
     */
    @GetMapping(path = "/products/images/**", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    public ResponseEntity<Resource> getProductImage(HttpServletRequest request) {
        String fullPath = request.getRequestURI().split("/products/images/")[1];
        Resource resource = productService.loadImageAsResource(fullPath);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(resource);
    }
}

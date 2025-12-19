package com.appGate.inventory.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.appGate.inventory.models.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Query(value = "SELECT * FROM products p WHERE p.id IN (SELECT MIN(p2.id) FROM products p2 GROUP BY p2.sub_category_id)", nativeQuery = true)
    List<Product> findOneProductPerSubCategory();

    List<Product> findBySubCategoryId(Long subCategoryId);

    List<Product> findByIdIn(List<Long> productIds);

    List<Product> findTop10ByOrderByIdDesc();

    @Query(value = "SELECT * FROM products ORDER BY RAND() LIMIT 10", nativeQuery = true)
    List<Product> findRandomProducts();

    @Query(value = "SELECT p.id FROM products p DESC LIMIT 10", nativeQuery = true)
    List<Long> findTopProductIds();

    // New pagination and search methods
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    Page<Product> findBySubCategoryId(Long subCategoryId, Pageable pageable);

    Page<Product> findByProductNameContainingIgnoreCase(String productName, Pageable pageable);

    Page<Product> findBySellingPriceBetween(Double minPrice, Double maxPrice, Pageable pageable);

    Page<Product> findByCategoryIdAndSellingPriceBetween(
        Long categoryId, Double minPrice, Double maxPrice, Pageable pageable);

}

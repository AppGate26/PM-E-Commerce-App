package com.appGate.inventory.repository;

import com.appGate.inventory.models.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubCategoryRepository extends JpaRepository<SubCategory, Long>, JpaSpecificationExecutor<SubCategory> {

    // Explicit JPQL: the computed getCategoryId() getter on SubCategory makes Spring Data treat
    // "CategoryId" as a direct property, so the derived query fails to traverse category -> id.
    @Query("select s from SubCategory s where s.category.id = :categoryId")
    List<SubCategory> findByCategoryId(@Param("categoryId") Long categoryId);
}

package com.appGate.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.appGate.inventory.models.Category;

public interface CategoryRepository  extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category>{
    
}

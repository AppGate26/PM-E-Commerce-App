package com.appGate.inventory.service;

import org.springframework.stereotype.Service;

import com.appGate.inventory.repository.CategoryRepository;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.inventory.repository.SubCategoryRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class StockService {
	private final StockRepository stockRepository;
	private final CategoryRepository categoryRepository;
	private final SubCategoryRepository subCategoryRepository;
	
	
}

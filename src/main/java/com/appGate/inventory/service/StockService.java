package com.appGate.inventory.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.appGate.inventory.dto.StockDto;
import com.appGate.inventory.dto.UpdateStockDto;
import com.appGate.inventory.models.Category;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.Stock;
import com.appGate.inventory.models.SubCategory;
import com.appGate.inventory.repository.CategoryRepository;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.repository.StockRepository;
import com.appGate.inventory.repository.SubCategoryRepository;
import com.appGate.inventory.response.BaseResponse;

import lombok.AllArgsConstructor;

import java.util.List;

@Service
@AllArgsConstructor
public class StockService {
	private final StockRepository stockRepository;
	private final CategoryRepository categoryRepository;
	private final SubCategoryRepository subCategoryRepository;
	private final ProductRepository productRepository;

	@Transactional
	public BaseResponse createStock(StockDto dto) {
		try {
			Product product = productRepository.findById(dto.getProductId())
					.orElseThrow(() -> new RuntimeException("Product not found"));

			// Check if stock already exists for this product
			if (stockRepository.findByProductId(dto.getProductId()).isPresent()) {
				return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
						"Stock already exists for this product. Use update instead.", null);
			}

			Stock stock = new Stock();
			stock.setProduct(product);
			stock.setDescription(dto.getDescription());
			stock.setQuantity(dto.getQuantity());
			stock.setReorderLevel(dto.getReorderLevel() != null ? dto.getReorderLevel() : 10);
			stock.setUnitPrice(dto.getUnitPrice());
			stock.setAccountToCredit(dto.getAccountToCredit());
			stock.setAccountToDebit(dto.getAccountToDebit());

			// Set new fields for opening stock support
			stock.setSupplierId(dto.getSupplierId());
			stock.setStockDate(dto.getStockDate() != null ? dto.getStockDate() : java.time.LocalDate.now());
			stock.setEnteredBy(dto.getEnteredBy());
			stock.setIsOpeningStock(dto.getIsOpeningStock() != null ? dto.getIsOpeningStock() : false);

			if (dto.getCategoryId() != null) {
				Category category = categoryRepository.findById(dto.getCategoryId())
						.orElse(null);
				stock.setCategory(category);
			}

			if (dto.getSubCategoryId() != null) {
				SubCategory subCategory = subCategoryRepository.findById(dto.getSubCategoryId())
						.orElse(null);
				stock.setSubCategory(subCategory);
			}

			Stock savedStock = stockRepository.save(stock);
			return new BaseResponse(HttpStatus.CREATED.value(), "Stock created successfully", savedStock);
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error creating stock: " + e.getMessage(), null);
		}
	}

	public BaseResponse getAllStocks() {
		List<Stock> stocks = stockRepository.findAll();
		return new BaseResponse(HttpStatus.OK.value(), "Stocks retrieved successfully", stocks);
	}

	public BaseResponse getStockById(Long id) {
		Stock stock = stockRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Stock not found"));
		return new BaseResponse(HttpStatus.OK.value(), "Stock retrieved successfully", stock);
	}

	public BaseResponse getStockByProductId(Long productId) {
		Stock stock = stockRepository.findByProductId(productId)
				.orElseThrow(() -> new RuntimeException("Stock not found for this product"));
		return new BaseResponse(HttpStatus.OK.value(), "Stock retrieved successfully", stock);
	}

	public BaseResponse getLowStockItems() {
		List<Stock> lowStockItems = stockRepository.findLowStockItems();
		return new BaseResponse(HttpStatus.OK.value(), "Low stock items retrieved successfully", lowStockItems);
	}

	public BaseResponse getOpeningStocks() {
		List<Stock> openingStocks = stockRepository.findByIsOpeningStockTrue();
		return new BaseResponse(HttpStatus.OK.value(), "Opening stocks retrieved successfully", openingStocks);
	}

	@Transactional
	public BaseResponse updateStock(Long id, UpdateStockDto dto) {
		try {
			Stock stock = stockRepository.findById(id)
					.orElseThrow(() -> new RuntimeException("Stock not found"));

			if (dto.getDescription() != null) {
				stock.setDescription(dto.getDescription());
			}
			if (dto.getQuantity() != null) {
				stock.setQuantity(dto.getQuantity());
			}
			if (dto.getReorderLevel() != null) {
				stock.setReorderLevel(dto.getReorderLevel());
			}
			if (dto.getUnitPrice() != null) {
				stock.setUnitPrice(dto.getUnitPrice());
			}
			if (dto.getAccountToCredit() != null) {
				stock.setAccountToCredit(dto.getAccountToCredit());
			}
			if (dto.getAccountToDebit() != null) {
				stock.setAccountToDebit(dto.getAccountToDebit());
			}

			Stock updatedStock = stockRepository.save(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock updated successfully", updatedStock);
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error updating stock: " + e.getMessage(), null);
		}
	}

	@Transactional
	public BaseResponse deleteStock(Long id) {
		try {
			Stock stock = stockRepository.findById(id)
					.orElseThrow(() -> new RuntimeException("Stock not found"));
			stockRepository.delete(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock deleted successfully", null);
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error deleting stock: " + e.getMessage(), null);
		}
	}

	@Transactional
	public BaseResponse adjustStockQuantity(Long id, Integer quantityChange) {
		try {
			Stock stock = stockRepository.findById(id)
					.orElseThrow(() -> new RuntimeException("Stock not found"));

			int newQuantity = stock.getQuantity() + quantityChange;
			if (newQuantity < 0) {
				return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
						"Cannot reduce stock below 0", null);
			}

			stock.setQuantity(newQuantity);
			Stock updatedStock = stockRepository.save(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock quantity adjusted successfully", updatedStock);
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error adjusting stock quantity: " + e.getMessage(), null);
		}
	}
}

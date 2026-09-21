package com.appGate.inventory.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.appGate.inventory.dto.StockAllocationDto;
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
import com.appGate.rbac.service.BranchScopeService;

import lombok.AllArgsConstructor;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@Service
@AllArgsConstructor
public class StockService {
	private final StockRepository stockRepository;
	private final CategoryRepository categoryRepository;
	private final SubCategoryRepository subCategoryRepository;
	private final ProductRepository productRepository;
	private final BranchScopeService branchScopeService;

	/** Load a stock row, refusing one held at another branch. */
	private Stock loadStockInScope(Long id) {
		Stock stock = stockRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Stock not found"));
		branchScopeService.assertCanAccess(stock.getBranchId());
		return stock;
	}

	@Transactional
	public BaseResponse createStock(StockDto dto) {
		try {
			Product product = productRepository.findById(dto.getProductId())
					.orElseThrow(() -> new RuntimeException("Product not found"));

			// A branch user always creates stock at their own branch; only an admin
			// may create central (null-branch) stock.
			Long branchId = branchScopeService.resolveWriteBranchId(dto.getBranchId());

			// Duplicate check is per product + branch combination.
			// branchId == null means central/HQ stock.
			boolean alreadyExists = (branchId == null)
					? stockRepository.findByProductIdAndBranchIdIsNull(dto.getProductId()).isPresent()
					: stockRepository.findByProductIdAndBranchId(dto.getProductId(), branchId).isPresent();

			if (alreadyExists) {
				String scope = branchId == null ? "central stock" : "branch " + branchId;
				return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
						"Stock already exists for this product at " + scope + ". Use update or allocation instead.", null);
			}

			Stock stock = new Stock();
			stock.setProduct(product);
			stock.setDescription(dto.getDescription());
			stock.setQuantity(dto.getQuantity());
			stock.setReorderLevel(dto.getReorderLevel() != null ? dto.getReorderLevel() : 10);
			stock.setUnitPrice(dto.getUnitPrice());
			stock.setCostPrice(dto.getCostPrice());
			stock.setSellingPrice(dto.getSellingPrice());
			stock.setAccountToCredit(dto.getAccountToCredit());
			stock.setAccountToDebit(dto.getAccountToDebit());
			stock.setBranchId(branchId); // null = central stock

			// Opening stock support - can come from either supplier or warehouse
			stock.setSupplierId(dto.getSupplierId());
			stock.setWarehouseId(dto.getWarehouseId());
			stock.setSourceType(dto.getSourceType() != null ? dto.getSourceType() : "supplier");
			stock.setStockDate(dto.getStockDate() != null ? dto.getStockDate() : java.time.LocalDate.now());
			stock.setEnteredBy(dto.getEnteredBy());
			stock.setIsOpeningStock(dto.getIsOpeningStock() != null ? dto.getIsOpeningStock() : false);

			if (dto.getCategoryId() != null) {
				Category category = categoryRepository.findById(dto.getCategoryId()).orElse(null);
				stock.setCategory(category);
			}

			if (dto.getSubCategoryId() != null) {
				SubCategory subCategory = subCategoryRepository.findById(dto.getSubCategoryId()).orElse(null);
				stock.setSubCategory(subCategory);
			}

			Stock savedStock = stockRepository.save(stock);
			// Generate a human-readable stock reference from the identity id (e.g. PM-STK-0001)
			// so the Stock Edit screen has a stable, pickable reference number.
			if (savedStock.getStockRef() == null) {
				savedStock.setStockRef(String.format("PM-STK-%04d", savedStock.getId()));
				savedStock = stockRepository.save(savedStock);
			}
			return new BaseResponse(HttpStatus.CREATED.value(), "Stock created successfully", savedStock);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error creating stock: " + e.getMessage(), null);
		}
	}

	/**
	 * Approved "add to stock" requests should land as new supply regardless of
	 * whether the product already has a stock row at the target scope: create
	 * it if this is the first time, or add the quantity on top of what's
	 * already there otherwise. Unlike {@link #createStock}, this never fails
	 * with a "already exists" error - that error only makes sense when a user
	 * is knowingly trying to create a stock row via the direct create endpoint.
	 */
	@Transactional
	public BaseResponse addToStock(StockDto dto) {
		try {
			Long branchId = branchScopeService.resolveWriteBranchId(dto.getBranchId());

			Stock existing = (branchId == null
					? stockRepository.findByProductIdAndBranchIdIsNull(dto.getProductId())
					: stockRepository.findByProductIdAndBranchId(dto.getProductId(), branchId))
					.orElse(null);

			if (existing == null) {
				return createStock(dto);
			}

			existing.setQuantity(existing.getQuantity() + dto.getQuantity());
			if (dto.getUnitPrice() != null) {
				existing.setUnitPrice(dto.getUnitPrice());
			}
			if (dto.getCostPrice() != null) {
				existing.setCostPrice(dto.getCostPrice());
			}
			if (dto.getSellingPrice() != null) {
				existing.setSellingPrice(dto.getSellingPrice());
			}
			if (dto.getAccountToCredit() != null) {
				existing.setAccountToCredit(dto.getAccountToCredit());
			}
			if (dto.getAccountToDebit() != null) {
				existing.setAccountToDebit(dto.getAccountToDebit());
			}

			Stock updatedStock = stockRepository.save(existing);
			return new BaseResponse(HttpStatus.OK.value(), "Stock quantity updated successfully", updatedStock);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error adding to stock: " + e.getMessage(), null);
		}
	}

	public BaseResponse getAllStocks() {
		// Branch users only see stock held at their own branch. The filter is pushed
		// into the query rather than loading every stock row in the company first.
		Long branchId = branchScopeService.getScopedBranchId();
		List<Stock> stocks = branchId == null
				? stockRepository.findAll()
				: stockRepository.findByBranchId(branchId);
		return new BaseResponse(HttpStatus.OK.value(), "Stocks retrieved successfully", stocks);
	}

	public BaseResponse getStockById(Long id) {
		Stock stock = loadStockInScope(id);
		return new BaseResponse(HttpStatus.OK.value(), "Stock retrieved successfully", stock);
	}

	public BaseResponse getStockByProductId(Long productId) {
		// A branch user asking "what is my stock of product X" must get their own
		// branch's row, not whichever row happens to come back first.
		Long branchId = branchScopeService.getScopedBranchId();
		Stock stock = (branchId == null
				? stockRepository.findByProductId(productId)
				: stockRepository.findByProductIdAndBranchId(productId, branchId))
				.orElseThrow(() -> new RuntimeException("Stock not found for this product"));
		return new BaseResponse(HttpStatus.OK.value(), "Stock retrieved successfully", stock);
	}

	public BaseResponse getLowStockItems() {
		Long branchId = branchScopeService.getScopedBranchId();
		List<Stock> lowStockItems = branchId == null
				? stockRepository.findLowStockItems()
				: stockRepository.findLowStockItemsByBranch(branchId);
		return new BaseResponse(HttpStatus.OK.value(), "Low stock items retrieved successfully", lowStockItems);
	}

	public BaseResponse getOpeningStocks() {
		Long branchId = branchScopeService.getScopedBranchId();
		List<Stock> openingStocks = branchId == null
				? stockRepository.findByIsOpeningStockTrue()
				: stockRepository.findByIsOpeningStockTrueAndBranchId(branchId);
		return new BaseResponse(HttpStatus.OK.value(), "Opening stocks retrieved successfully", openingStocks);
	}

	@Transactional
	public BaseResponse updateStock(Long id, UpdateStockDto dto) {
		try {
			Stock stock = loadStockInScope(id);

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
			if (dto.getCostPrice() != null) {
				stock.setCostPrice(dto.getCostPrice());
			}
			if (dto.getSellingPrice() != null) {
				stock.setSellingPrice(dto.getSellingPrice());
			}
			if (dto.getAccountToCredit() != null) {
				stock.setAccountToCredit(dto.getAccountToCredit());
			}
			if (dto.getAccountToDebit() != null) {
				stock.setAccountToDebit(dto.getAccountToDebit());
			}

			Stock updatedStock = stockRepository.save(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock updated successfully", updatedStock);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error updating stock: " + e.getMessage(), null);
		}
	}

	@Transactional
	public BaseResponse deleteStock(Long id) {
		try {
			Stock stock = loadStockInScope(id);
			stockRepository.delete(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock deleted successfully", null);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error deleting stock: " + e.getMessage(), null);
		}
	}

	/**
	 * Allocate stock from the central (HQ) pool to a specific branch.
	 * Decrements central stock and increments (or creates) the branch stock entry.
	 */
	@Transactional
	public BaseResponse allocateStockToBranch(StockAllocationDto dto) {
		try {
			// Allocation moves stock *out of* the central pool, which no branch owns.
			// Only head office / an admin may do it; a branch cannot help itself.
			if (branchScopeService.isBranchScoped()) {
				throw new AccessDeniedException(
						"Only head office can allocate central stock to a branch.");
			}

			// 1. Find central stock
			Stock centralStock = stockRepository.findByProductIdAndBranchIdIsNull(dto.getProductId())
					.orElseThrow(() -> new RuntimeException(
							"No central stock found for product ID " + dto.getProductId()
									+ ". Create central stock first."));

			// 2. Verify sufficient quantity
			if (centralStock.getQuantity() < dto.getQuantity()) {
				return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
						"Insufficient central stock. Available: " + centralStock.getQuantity()
								+ ", Requested: " + dto.getQuantity(), null);
			}

			// 3. Decrement central stock
			centralStock.setQuantity(centralStock.getQuantity() - dto.getQuantity());
			stockRepository.save(centralStock);

			// 4. Find or create branch stock
			Stock branchStock = stockRepository
					.findByProductIdAndBranchId(dto.getProductId(), dto.getBranchId())
					.orElseGet(() -> {
						Stock s = new Stock();
						s.setProduct(centralStock.getProduct());
						s.setCategory(centralStock.getCategory());
						s.setSubCategory(centralStock.getSubCategory());
						s.setBranchId(dto.getBranchId());
						s.setDescription(centralStock.getDescription());
						s.setReorderLevel(centralStock.getReorderLevel());
						s.setUnitPrice(centralStock.getUnitPrice());
						s.setAccountToCredit(centralStock.getAccountToCredit());
						s.setAccountToDebit(centralStock.getAccountToDebit());
						s.setStockDate(java.time.LocalDate.now());
						s.setQuantity(0);
						return s;
					});

			// 5. Increment branch stock
			branchStock.setQuantity(branchStock.getQuantity() + dto.getQuantity());
			Stock saved = stockRepository.save(branchStock);
			if (saved.getStockRef() == null) {
				saved.setStockRef(String.format("PM-STK-%04d", saved.getId()));
				saved = stockRepository.save(saved);
			}

			return new BaseResponse(HttpStatus.OK.value(),
					"Allocated " + dto.getQuantity() + " unit(s) to branch " + dto.getBranchId(), saved);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (RuntimeException e) {
			return new BaseResponse(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null);
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error allocating stock: " + e.getMessage(), null);
		}
	}

	public BaseResponse getStockByBranch(Long branchId) {
		// The branch id comes straight off the URL, so it has to be validated: a
		// branch user may only ask for their own branch.
		Long scopedBranchId = branchScopeService.resolveReadBranchId(branchId);
		List<Stock> stocks = stockRepository.findByBranchId(scopedBranchId);
		return new BaseResponse(HttpStatus.OK.value(), "Branch stock retrieved successfully", stocks);
	}

	public BaseResponse getCentralStock() {
		// Central stock belongs to no branch, so a branch user has no business seeing it.
		if (branchScopeService.isBranchScoped()) {
			throw new AccessDeniedException("Central stock is only visible to head office.");
		}
		List<Stock> stocks = stockRepository.findByBranchIdIsNull();
		return new BaseResponse(HttpStatus.OK.value(), "Central stock retrieved successfully", stocks);
	}

	@Transactional
	public BaseResponse adjustStockQuantity(Long id, Integer quantityChange) {
		try {
			Stock stock = loadStockInScope(id);

			int newQuantity = stock.getQuantity() + quantityChange;
			if (newQuantity < 0) {
				return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
						"Cannot reduce stock below 0", null);
			}

			stock.setQuantity(newQuantity);
			Stock updatedStock = stockRepository.save(stock);
			return new BaseResponse(HttpStatus.OK.value(), "Stock quantity adjusted successfully", updatedStock);
		} catch (AccessDeniedException e) {
			throw e;
		} catch (Exception e) {
			return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
					"Error adjusting stock quantity: " + e.getMessage(), null);
		}
	}
}

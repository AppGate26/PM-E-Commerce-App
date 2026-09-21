package com.appGate.inventory.models;

import com.appGate.rbac.context.BranchOwned;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** Stock held at a branch. A null branch id is central/HQ stock. */
@Entity
@Data
@NoArgsConstructor
@Table(name = "stocks")

@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Stock extends BaseEntity implements BranchOwned {
	@Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// Human-readable reference (e.g. PM-STK-0001) generated from the id after insert.
	@Column(name = "stock_ref", unique = true)
	private String stockRef;

	private String description;

	private Integer quantity;

	private Integer reorderLevel;

	private String accountToCredit;

	private String accountToDebit;

	private String unitPrice;

	// Cost price (what the item was bought for) and selling price shown on the
	// stock register. Kept as strings to match the existing unitPrice convention.
	@Column(name = "cost_price")
	private String costPrice;

	@Column(name = "selling_price")
	private String sellingPrice;

	@Column(name = "supplier_id")
	private Long supplierId;

	@Column(name = "warehouse_id")
	private Long warehouseId;

	@Column(name = "source_type")
	private String sourceType; // "supplier" or "warehouse"

	@Column(name = "stock_date")
	private LocalDate stockDate;

	@Column(name = "entered_by")
	private Long enteredBy; // User ID who entered the stock

	@Column(name = "is_opening_stock")
	private Boolean isOpeningStock = false; // Flag to identify opening stock

	@Column(name = "branch_id")
	private Long branchId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="subCategory_id")
	private SubCategory subCategory;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="category_id")
	private Category category;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="product_id")
	private Product product;

}

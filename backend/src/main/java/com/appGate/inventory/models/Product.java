package com.appGate.inventory.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.appGate.rbac.context.BranchOwned;

import jakarta.persistence.*;
import lombok.Data;

/**
 * A product. Every product belongs to a branch: branch staff create products for
 * their own branch (stamped by BranchStampListener), and everything else --
 * including all online products -- belongs to the Head Office branch.
 */
@Entity
@Data
@Table(name = "products")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Product extends BaseEntity implements BranchOwned {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// Human-facing product code (e.g. PM-PD-0001), generated at creation. Distinct from
	// the raw auto-increment id, which was previously surfaced as the "product id".
	@Column(name = "product_code", unique = true)
	private String productCode;

	@Column(name = "product_name")
	private String productName;

	// Matches ProductDto's @Size(max = 2000) - was left at Hibernate's default
	// VARCHAR(255), which silently rejected/truncated any longer description.
	@Column(name = "product_description", length = 2000)
	private String productDescription;
		
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="category_id")
	private Category category;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="sub_category_id")
	private SubCategory subCategory;

	@Column(name = "selling_price")
	private double sellingPrice;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
	private Supplier supplier;

	@Column(name = "cost_price")
	private double costPrice;

	@Column(name = "manufacturer_name")
	private String manufacturerName;

	@Column(name = "quantity")
	private Integer quantity;

	@Column(name = "productImage")
	private String productImage;

	@Column(name = "weight_kg", precision = 10, scale = 3)
	private java.math.BigDecimal weightKg;

	@Column(name = "branch_id")
	private Long branchId;

	// Expose flat ids alongside the (lazy) nested objects so clients can filter/auto-fill
	// by category / sub-category without depending on the nested graph being serialized.
	@JsonProperty("categoryId")
	public Long getCategoryId() {
		return category != null ? category.getId() : null;
	}

	@JsonProperty("subCategoryId")
	public Long getSubCategoryId() {
		return subCategory != null ? subCategory.getId() : null;
	}
}

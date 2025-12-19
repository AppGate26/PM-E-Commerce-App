package com.appGate.inventory.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "products")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Product extends BaseEntity {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "product_name")
	private String productName;

	@Column(name = "product_description")
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
 
}

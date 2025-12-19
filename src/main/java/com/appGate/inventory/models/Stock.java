package com.appGate.inventory.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@Table(name = "stocks")

@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Stock extends BaseEntity {
	@Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	private String description;
	
	private Integer quantity;

	private Integer reorderLevel;
	
	private String accountToCredit;
	
	private String accountToDebit;
	
	private String unitPrice;
	
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

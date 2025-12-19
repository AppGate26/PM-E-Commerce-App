package com.appGate.orderingsales.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
@Table(name = "wishlists")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class WishList extends BaseEntity {
    
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "status")
    private Boolean status = true;
}

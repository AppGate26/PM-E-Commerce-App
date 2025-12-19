package com.appGate.inventory.models;

import com.appGate.inventory.enums.ReviewStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductReview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name")
    private String userName; // Cached user name for display

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1-5 stars

    @Column(name = "title")
    private String title;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "is_verified_purchase")
    private Boolean isVerifiedPurchase = false; // User actually bought the product

    @Column(name = "helpful_count")
    private Integer helpfulCount = 0; // How many users found this helpful

    @Column(name = "not_helpful_count")
    private Integer notHelpfulCount = 0;

    @Column(name = "admin_response", length = 1000)
    private String adminResponse; // Response from admin/seller

    @Column(name = "images")
    private String images; // Comma-separated image URLs
}

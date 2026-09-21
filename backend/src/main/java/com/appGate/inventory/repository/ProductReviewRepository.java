package com.appGate.inventory.repository;

import com.appGate.inventory.enums.ReviewStatus;
import com.appGate.inventory.models.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long>, JpaSpecificationExecutor<ProductReview> {

    Page<ProductReview> findByProductIdAndStatus(Long productId, ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByProductId(Long productId, Pageable pageable);

    Page<ProductReview> findByUserIdAndStatus(Long userId, ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByUserId(Long userId, Pageable pageable);

    Optional<ProductReview> findByProductIdAndUserId(Long productId, Long userId);

    List<ProductReview> findByProductIdAndStatus(Long productId, ReviewStatus status);

    Long countByProductIdAndStatus(Long productId, ReviewStatus status);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId AND r.status = :status")
    Double getAverageRatingByProductId(Long productId, ReviewStatus status);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId AND r.rating = :rating AND r.status = :status")
    Long countByProductIdAndRatingAndStatus(Long productId, Integer rating, ReviewStatus status);

    Page<ProductReview> findByStatus(ReviewStatus status, Pageable pageable);
}

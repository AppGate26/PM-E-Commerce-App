package com.appGate.inventory.service;

import com.appGate.inventory.dto.CreateReviewDto;
import com.appGate.inventory.dto.UpdateReviewDto;
import com.appGate.inventory.enums.ReviewStatus;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.models.ProductReview;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.inventory.repository.ProductReviewRepository;
import com.appGate.inventory.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Transactional
    public BaseResponse createReview(CreateReviewDto dto) {
        try {
            // Check if user already reviewed this product
            Optional<ProductReview> existingReview = reviewRepository.findByProductIdAndUserId(
                    dto.getProductId(), dto.getUserId());

            if (existingReview.isPresent()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "You have already reviewed this product", null);
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            ProductReview review = new ProductReview();
            review.setProduct(product);
            review.setUserId(dto.getUserId());
            review.setUserName(dto.getUserName());
            review.setRating(dto.getRating());
            review.setTitle(dto.getTitle());
            review.setComment(dto.getComment());
            review.setStatus(ReviewStatus.PENDING); // Pending moderation
            review.setIsVerifiedPurchase(dto.getIsVerifiedPurchase());
            review.setImages(dto.getImages());
            review.setHelpfulCount(0);
            review.setNotHelpfulCount(0);

            ProductReview savedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.CREATED.value(),
                    "Review submitted successfully. It will be visible after moderation.", savedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to create review: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProductReviews(Long productId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ProductReview> reviews = reviewRepository.findByProductIdAndStatus(
                    productId, ReviewStatus.APPROVED, pageable);

            // Get review statistics
            Map<String, Object> response = new HashMap<>();
            response.put("reviews", reviews);
            response.put("statistics", getProductReviewStats(productId));

            return new BaseResponse(HttpStatus.OK.value(),
                    "Product reviews retrieved successfully", response);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve reviews: " + e.getMessage(), null);
        }
    }

    public BaseResponse getUserReviews(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ProductReview> reviews = reviewRepository.findByUserId(userId, pageable);

            return new BaseResponse(HttpStatus.OK.value(),
                    "User reviews retrieved successfully", reviews);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve user reviews: " + e.getMessage(), null);
        }
    }

    public BaseResponse getReviewById(Long reviewId) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review retrieved successfully", review);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve review: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updateReview(Long reviewId, UpdateReviewDto dto) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            if (dto.getRating() != null) {
                review.setRating(dto.getRating());
            }
            if (dto.getTitle() != null) {
                review.setTitle(dto.getTitle());
            }
            if (dto.getComment() != null) {
                review.setComment(dto.getComment());
            }
            if (dto.getImages() != null) {
                review.setImages(dto.getImages());
            }

            // Reset to pending if updated
            review.setStatus(ReviewStatus.PENDING);

            ProductReview updatedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review updated successfully", updatedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to update review: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteReview(Long reviewId) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            reviewRepository.delete(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review deleted successfully", null);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to delete review: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse approveReview(Long reviewId) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            review.setStatus(ReviewStatus.APPROVED);

            ProductReview updatedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review approved successfully", updatedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to approve review: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse rejectReview(Long reviewId, String reason) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            review.setStatus(ReviewStatus.REJECTED);
            review.setAdminResponse(reason);

            ProductReview updatedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review rejected successfully", updatedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to reject review: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse markHelpful(Long reviewId, boolean helpful) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            if (helpful) {
                review.setHelpfulCount(review.getHelpfulCount() + 1);
            } else {
                review.setNotHelpfulCount(review.getNotHelpfulCount() + 1);
            }

            ProductReview updatedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review feedback recorded", updatedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to record feedback: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse addAdminResponse(Long reviewId, String response) {
        try {
            ProductReview review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));

            review.setAdminResponse(response);

            ProductReview updatedReview = reviewRepository.save(review);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Admin response added successfully", updatedReview);

        } catch (RuntimeException e) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), e.getMessage(), null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to add admin response: " + e.getMessage(), null);
        }
    }

    public BaseResponse getPendingReviews(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ProductReview> reviews = reviewRepository.findByStatus(ReviewStatus.PENDING, pageable);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Pending reviews retrieved successfully", reviews);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve pending reviews: " + e.getMessage(), null);
        }
    }

    // Helper method to get product review statistics
    private Map<String, Object> calculateProductReviewStats(Long productId) {
        Double averageRating = reviewRepository.getAverageRatingByProductId(productId, ReviewStatus.APPROVED);
        Long totalReviews = reviewRepository.countByProductIdAndStatus(productId, ReviewStatus.APPROVED);

        // Get rating distribution
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            Long count = reviewRepository.countByProductIdAndRatingAndStatus(productId, i, ReviewStatus.APPROVED);
            ratingDistribution.put(i, count);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", averageRating != null ? averageRating : 0.0);
        stats.put("totalReviews", totalReviews);
        stats.put("ratingDistribution", ratingDistribution);

        return stats;
    }

    public BaseResponse getProductReviewStats(Long productId) {
        try {
            Map<String, Object> stats = calculateProductReviewStats(productId);

            return new BaseResponse(HttpStatus.OK.value(),
                    "Review statistics retrieved successfully", stats);

        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Failed to retrieve review statistics: " + e.getMessage(), null);
        }
    }
}

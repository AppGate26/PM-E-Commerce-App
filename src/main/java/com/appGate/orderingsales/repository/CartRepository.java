package com.appGate.orderingsales.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.appGate.orderingsales.models.Cart;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long>, JpaSpecificationExecutor<Cart> {

    List<Cart> findByUserIdAndStatus(Long userId, Boolean status);

    Optional<Cart> findByUserIdAndProductIdAndStatus(Long userId, Long productId, Boolean status);

    void deleteByUserIdAndStatus(Long userId, Boolean status);
}

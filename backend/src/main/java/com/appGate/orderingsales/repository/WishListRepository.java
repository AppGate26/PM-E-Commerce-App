package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.models.WishList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface WishListRepository extends JpaRepository<WishList, Long>, JpaSpecificationExecutor<WishList> {

    List<WishList> findByUserIdAndStatus(Long userId, Boolean status);

    WishList findByUserIdAndProductId(Long userId, Long productId);
}
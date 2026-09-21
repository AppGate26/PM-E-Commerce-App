package com.appGate.orderingsales.service;

import org.springframework.stereotype.Service;

import com.appGate.orderingsales.dto.WishListDto;
import com.appGate.orderingsales.models.WishList;
import com.appGate.orderingsales.repository.WishListRepository;
import com.appGate.orderingsales.response.BaseResponse;

import org.springframework.http.HttpStatus;

@Service
public class WishListService { 

    private final WishListRepository wishListRepository;

    public WishListService(WishListRepository wishListRepository) {
        this.wishListRepository = wishListRepository;
    }

    public BaseResponse createWishList(WishListDto wishListDto) {
        WishList wishList = new WishList();
        wishList.setProductId(wishListDto.getProductId());
        wishList.setUserId(wishListDto.getUserId());
        wishListRepository.save(wishList);

        return new BaseResponse(HttpStatus.CREATED.value(), "Wish list created successfully", wishList);
    }

    public BaseResponse getUserActiveWishList(Long userId) {
        return new BaseResponse(HttpStatus.OK.value(), "Wish list retrieved successfully", wishListRepository.findByUserIdAndStatus(userId, true));
    }

    public BaseResponse updateWishList(Long userId, Long productId) {
        WishList wishList = wishListRepository.findByUserIdAndProductId(userId, productId);
        if (wishList == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Wish list not found", null);
        }

        wishList.setStatus(false);
        wishListRepository.save(wishList);

        return new BaseResponse(HttpStatus.OK.value(), "Wish list updated successfully", wishList);
    }

}
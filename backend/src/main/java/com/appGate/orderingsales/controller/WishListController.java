package com.appGate.orderingsales.controller;


import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.appGate.orderingsales.dto.WishListDto;
import com.appGate.orderingsales.response.BaseResponse;

import com.appGate.orderingsales.service.WishListService;

@RestController
@RequestMapping("/api")
public class WishListController {

    private final WishListService wishListService;
    
    public WishListController(WishListService wishListService) {
        this.wishListService = wishListService;
    }

    @PostMapping("/users/wish-lists")
    public BaseResponse createWishList(@RequestBody WishListDto wishListDto) {
        return wishListService.createWishList(wishListDto);
    }

    @GetMapping("/users/wish-lists/{userId}")
    public BaseResponse getWishList(@PathVariable Long userId) {
        return wishListService.getUserActiveWishList(userId);
    }

    @DeleteMapping("/users/wish-lists/{userId}/products/{productId}")
    public BaseResponse removeFromWishList(@PathVariable Long userId, @PathVariable Long productId) {
        return wishListService.updateWishList(userId, productId);
    }
    

}
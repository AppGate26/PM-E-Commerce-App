package com.appGate.rbac.controller;

import com.appGate.rbac.dto.UserAddressDto;
import com.appGate.rbac.dto.UserPaymentMethodDto;
import com.appGate.rbac.models.UserAddress;
import com.appGate.rbac.models.UserLogTrail;
import com.appGate.rbac.models.UserPaymentMethod;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    // ==================== ADDRESS ENDPOINTS ====================

    @GetMapping("/{userId}/addresses")
    public BaseResponse getUserAddresses(@PathVariable Long userId) {
        List<UserAddress> addresses = userProfileService.getUserAddresses(userId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", addresses);
    }

    @PostMapping("/{userId}/addresses")
    public BaseResponse addUserAddress(@PathVariable Long userId, @RequestBody UserAddressDto dto) {
        UserAddress address = userProfileService.addUserAddress(userId, dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", address);
    }

    @PutMapping("/{userId}/addresses/{addressId}")
    public BaseResponse updateUserAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId,
            @RequestBody UserAddressDto dto) {
        UserAddress address = userProfileService.updateUserAddress(userId, addressId, dto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", address);
    }

    @DeleteMapping("/{userId}/addresses/{addressId}")
    public BaseResponse deleteUserAddress(
            @PathVariable Long userId,
            @PathVariable Long addressId) {
        userProfileService.deleteUserAddress(userId, addressId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Address deleted");
    }

    // ==================== PAYMENT METHOD ENDPOINTS ====================

    @GetMapping("/{userId}/payment-methods")
    public BaseResponse getUserPaymentMethods(@PathVariable Long userId) {
        List<UserPaymentMethod> methods = userProfileService.getUserPaymentMethods(userId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", methods);
    }

    @PostMapping("/{userId}/payment-methods")
    public BaseResponse addUserPaymentMethod(@PathVariable Long userId, @RequestBody UserPaymentMethodDto dto) {
        UserPaymentMethod method = userProfileService.addUserPaymentMethod(userId, dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", method);
    }

    @DeleteMapping("/{userId}/payment-methods/{paymentMethodId}")
    public BaseResponse deleteUserPaymentMethod(
            @PathVariable Long userId,
            @PathVariable Long paymentMethodId) {
        userProfileService.deleteUserPaymentMethod(userId, paymentMethodId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Payment method deleted");
    }

    // ==================== LOG TRAIL ENDPOINT ====================

    @GetMapping("/admin/{userId}/log-trail")
    public BaseResponse getUserLogTrail(
            @PathVariable Long userId,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserLogTrail> logTrail = userProfileService.getUserLogTrail(userId, filter, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", logTrail);
    }
}

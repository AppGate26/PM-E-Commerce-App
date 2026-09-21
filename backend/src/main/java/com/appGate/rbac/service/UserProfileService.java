package com.appGate.rbac.service;

import com.appGate.rbac.dto.UserAddressDto;
import com.appGate.rbac.dto.UserPaymentMethodDto;
import com.appGate.rbac.models.UserAddress;
import com.appGate.rbac.models.UserLogTrail;
import com.appGate.rbac.models.UserPaymentMethod;
import com.appGate.rbac.repository.UserAddressRepository;
import com.appGate.rbac.repository.UserLogTrailRepository;
import com.appGate.rbac.repository.UserPaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserAddressRepository userAddressRepository;
    private final UserPaymentMethodRepository userPaymentMethodRepository;
    private final UserLogTrailRepository userLogTrailRepository;

    // ==================== ADDRESS MANAGEMENT ====================

    public List<UserAddress> getUserAddresses(Long userId) {
        return userAddressRepository.findByUserId(userId);
    }

    @Transactional
    public UserAddress addUserAddress(Long userId, UserAddressDto dto) {
        UserAddress address = new UserAddress();
        address.setUserId(userId);
        address.setAddressType(dto.getAddressType());
        address.setAddress(dto.getAddress());
        address.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
        return userAddressRepository.save(address);
    }

    @Transactional
    public UserAddress updateUserAddress(Long userId, Long addressId, UserAddressDto dto) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new RuntimeException("Address does not belong to user");
        }

        address.setAddressType(dto.getAddressType());
        address.setAddress(dto.getAddress());
        if (dto.getIsDefault() != null) {
            address.setIsDefault(dto.getIsDefault());
        }
        return userAddressRepository.save(address);
    }

    @Transactional
    public void deleteUserAddress(Long userId, Long addressId) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUserId().equals(userId)) {
            throw new RuntimeException("Address does not belong to user");
        }

        userAddressRepository.delete(address);
    }

    // ==================== PAYMENT METHOD MANAGEMENT ====================

    public List<UserPaymentMethod> getUserPaymentMethods(Long userId) {
        return userPaymentMethodRepository.findByUserId(userId);
    }

    @Transactional
    public UserPaymentMethod addUserPaymentMethod(Long userId, UserPaymentMethodDto dto) {
        UserPaymentMethod method = new UserPaymentMethod();
        method.setUserId(userId);
        method.setPaymentType(dto.getPaymentType());
        method.setAccountId(dto.getAccountId());
        method.setLastFour(dto.getLastFour());
        method.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
        return userPaymentMethodRepository.save(method);
    }

    @Transactional
    public void deleteUserPaymentMethod(Long userId, Long paymentMethodId) {
        UserPaymentMethod method = userPaymentMethodRepository.findById(paymentMethodId)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        if (!method.getUserId().equals(userId)) {
            throw new RuntimeException("Payment method does not belong to user");
        }

        userPaymentMethodRepository.delete(method);
    }

    // ==================== LOG TRAIL ====================

    public Page<UserLogTrail> getUserLogTrail(Long userId, String filter, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());

        if (filter != null && !filter.equalsIgnoreCase("ALL")) {
            return userLogTrailRepository.findByUserIdAndActivity(userId, filter, pageable);
        }
        return userLogTrailRepository.findByUserId(userId, pageable);
    }
}

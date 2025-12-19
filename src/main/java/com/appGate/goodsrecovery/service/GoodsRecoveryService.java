package com.appGate.goodsrecovery.service;

import com.appGate.client.models.Customer;
import com.appGate.client.repository.CustomerRepository;
import com.appGate.goodsrecovery.dto.CustomerRecoveryDto;
import com.appGate.goodsrecovery.dto.MarkAsRecoveredDto;
import com.appGate.goodsrecovery.dto.RecoveryItemDto;
import com.appGate.goodsrecovery.enums.GoodsRecoveryStatus;
import com.appGate.goodsrecovery.models.GoodsRecovery;
import com.appGate.goodsrecovery.models.RecoveryItem;
import com.appGate.goodsrecovery.repository.GoodsRecoveryRepository;
import com.appGate.goodsrecovery.repository.RecoveryItemRepository;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.repository.ProductRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GoodsRecoveryService {

    private final GoodsRecoveryRepository goodsRecoveryRepository;
    private final RecoveryItemRepository recoveryItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public GoodsRecoveryService(
            GoodsRecoveryRepository goodsRecoveryRepository,
            RecoveryItemRepository recoveryItemRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository) {
        this.goodsRecoveryRepository = goodsRecoveryRepository;
        this.recoveryItemRepository = recoveryItemRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    public BaseResponse getPendingRecoveries(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<GoodsRecovery> recoveries;
        if (status != null && !status.isEmpty()) {
            GoodsRecoveryStatus recoveryStatus = GoodsRecoveryStatus.valueOf(status);
            recoveries = goodsRecoveryRepository.findByStatus(recoveryStatus, pageable);
        } else {
            recoveries = goodsRecoveryRepository.findAll(pageable);
        }

        List<Map<String, Object>> recoveryList = recoveries.getContent().stream()
                .map(this::mapToRecoverySummary)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", recoveryList);
        response.put("totalPages", recoveries.getTotalPages());
        response.put("totalElements", recoveries.getTotalElements());
        response.put("currentPage", recoveries.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Goods to be recovered retrieved successfully", response);
    }

    public BaseResponse getCustomerRecoveryDetails(Long customerId) {
        GoodsRecovery recovery = goodsRecoveryRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No recovery record found for this customer"));

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        List<RecoveryItem> recoveryItems = recoveryItemRepository.findByGoodsRecoveryId(recovery.getId());

        CustomerRecoveryDto dto = new CustomerRecoveryDto();
        dto.setCustomerId(customerId);

        // Customer information
        Map<String, Object> customerInfo = new HashMap<>();
        customerInfo.put("fullName", customer.getSurname() + " " + customer.getFirstName());
        customerInfo.put("homeAddress", customer.getContactAddress());
        customerInfo.put("city", customer.getContactWard() != null ? customer.getContactWard().getName() : "");
        customerInfo.put("phoneNumber", customer.getPhoneNumber());
        customerInfo.put("emailAddress", customer.getEmail());
        customerInfo.put("photo", customer.getPassport());
        dto.setCustomerInfo(customerInfo);

        // Guarantor information
        Map<String, Object> guarantorInfo = new HashMap<>();
        guarantorInfo.put("fullName", customer.getNextOfKin());
        guarantorInfo.put("homeAddress", customer.getNextOfKinAddress());
        guarantorInfo.put("city", customer.getNextOfKinWard() != null ? customer.getNextOfKinWard().getName() : "");
        guarantorInfo.put("phoneNumber", customer.getPhoneNumber()); // Assuming same for now
        guarantorInfo.put("emailAddress", customer.getEmail()); // Assuming same for now
        dto.setGuarantorInfo(guarantorInfo);

        // Items to recover
        List<RecoveryItemDto> items = recoveryItems.stream()
                .map(this::mapToRecoveryItemDto)
                .collect(Collectors.toList());
        dto.setItemsToRecover(items);

        return new BaseResponse(HttpStatus.OK.value(), "Customer recovery details retrieved successfully", dto);
    }

    @Transactional
    public BaseResponse markAsRecovered(MarkAsRecoveredDto dto, HttpServletRequest request) {
        GoodsRecovery recovery = goodsRecoveryRepository.findByCustomerId(dto.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No recovery record found for this customer"));

        // Find the recovery item for this product
        List<RecoveryItem> items = recoveryItemRepository.findByGoodsRecoveryId(recovery.getId());
        RecoveryItem item = items.stream()
                .filter(i -> i.getProductId().equals(dto.getProductId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery item not found"));

        // Update recovery item
        item.setNumberOfItemsRecovered(dto.getNumberOfItemsRecovered());
        item.setTimeOfRecovery(dto.getTimeOfRecovery() != null ? dto.getTimeOfRecovery() : LocalDateTime.now());

        // Upload recovery photo if provided
        if (dto.getRecoveryPhoto() != null && !dto.getRecoveryPhoto().isEmpty()) {
            String photoUrl = saveRecoveryPhoto(dto.getRecoveryPhoto(), getBaseUrl(request));
            item.setRecoveryPhoto(photoUrl);
        }

        // Update status
        if (dto.getNumberOfItemsRecovered() >= item.getQuantity()) {
            item.setStatus(GoodsRecoveryStatus.RECOVERED);
        } else if (dto.getNumberOfItemsRecovered() > 0) {
            item.setStatus(GoodsRecoveryStatus.PARTIALLY_RECOVERED);
        }

        recoveryItemRepository.save(item);

        // Update GoodsRecovery status
        updateRecoveryStatus(recovery);

        return new BaseResponse(HttpStatus.OK.value(), "Item marked as recovered successfully", item);
    }

    public BaseResponse getRecoveryReports(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<GoodsRecovery> recoveries = goodsRecoveryRepository.findByStatus(GoodsRecoveryStatus.RECOVERED, pageable);

        List<Map<String, Object>> reports = recoveries.getContent().stream()
                .map(this::mapToRecoveryReport)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", reports);
        response.put("totalPages", recoveries.getTotalPages());
        response.put("totalElements", recoveries.getTotalElements());
        response.put("currentPage", recoveries.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Recovery reports retrieved successfully", response);
    }

    public BaseResponse getRecoveryReportDetail(Long recoveryId) {
        GoodsRecovery recovery = goodsRecoveryRepository.findById(recoveryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery record not found"));

        List<RecoveryItem> items = recoveryItemRepository.findByGoodsRecoveryId(recoveryId);

        Map<String, Object> report = new HashMap<>();
        report.put("recoveryId", recovery.getId());

        // Get customer info
        Customer customer = customerRepository.findById(recovery.getCustomerId()).orElse(null);
        if (customer != null) {
            report.put("customerName", customer.getSurname() + " " + customer.getFirstName());
        }

        // Get recovered items
        List<Map<String, Object>> recoveredItems = items.stream()
                .filter(item -> item.getStatus() == GoodsRecoveryStatus.RECOVERED)
                .map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("itemRecovered", item.getProductName());
                    itemMap.put("itemPhoto", item.getRecoveryPhoto());
                    itemMap.put("timeOfRecovery", item.getTimeOfRecovery());
                    itemMap.put("numberOfItemsRecovered", item.getNumberOfItemsRecovered());
                    return itemMap;
                })
                .collect(Collectors.toList());

        report.put("recoveredItems", recoveredItems);

        return new BaseResponse(HttpStatus.OK.value(), "Recovery report detail retrieved successfully", report);
    }

    private Map<String, Object> mapToRecoverySummary(GoodsRecovery recovery) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("goodsRecoveryId", recovery.getId());
        summary.put("customerId", recovery.getCustomerId());
        summary.put("recoveryStatus", recovery.getStatus().name());
        summary.put("numberOfItems", recovery.getTotalItems());

        // Get customer info
        Customer customer = customerRepository.findById(recovery.getCustomerId()).orElse(null);
        if (customer != null) {
            summary.put("customerName", customer.getSurname() + " " + customer.getFirstName());
            summary.put("customerPhoto", customer.getPassport());
        }

        return summary;
    }

    private RecoveryItemDto mapToRecoveryItemDto(RecoveryItem item) {
        RecoveryItemDto dto = new RecoveryItemDto();
        dto.setProductId(item.getProductId());
        dto.setProductName(item.getProductName());
        dto.setQuantity(item.getQuantity());
        dto.setRecoveryStatus(item.getStatus().name());
        dto.setRecoveryPhoto(item.getRecoveryPhoto());

        // Get product details
        Product product = productRepository.findById(item.getProductId()).orElse(null);
        if (product != null) {
            dto.setProductImage(product.getProductImage());
            dto.setDescription(product.getProductDescription());
        }

        return dto;
    }

    private Map<String, Object> mapToRecoveryReport(GoodsRecovery recovery) {
        Map<String, Object> report = new HashMap<>();
        report.put("recoveryId", recovery.getId());
        report.put("recoveryStatus", recovery.getStatus().name());
        report.put("numberOfItems", recovery.getRecoveredItems());
        report.put("recoveryDate", recovery.getUpdatedAt());

        // Get customer info
        Customer customer = customerRepository.findById(recovery.getCustomerId()).orElse(null);
        if (customer != null) {
            report.put("customerName", customer.getSurname() + " " + customer.getFirstName());
            report.put("customerPhoto", customer.getPassport());
        }

        return report;
    }

    private void updateRecoveryStatus(GoodsRecovery recovery) {
        List<RecoveryItem> items = recoveryItemRepository.findByGoodsRecoveryId(recovery.getId());

        int totalRecovered = 0;
        int totalItems = items.size();
        boolean allRecovered = true;
        boolean anyPartiallyRecovered = false;

        for (RecoveryItem item : items) {
            if (item.getStatus() == GoodsRecoveryStatus.RECOVERED) {
                totalRecovered++;
            } else if (item.getStatus() == GoodsRecoveryStatus.PARTIALLY_RECOVERED) {
                anyPartiallyRecovered = true;
                allRecovered = false;
            } else {
                allRecovered = false;
            }
        }

        recovery.setRecoveredItems(totalRecovered);

        if (allRecovered) {
            recovery.setStatus(GoodsRecoveryStatus.RECOVERED);
        } else if (totalRecovered > 0 || anyPartiallyRecovered) {
            recovery.setStatus(GoodsRecoveryStatus.PARTIALLY_RECOVERED);
        } else {
            recovery.setStatus(GoodsRecoveryStatus.NOT_YET_RECOVERED);
        }

        goodsRecoveryRepository.save(recovery);
    }

    private String saveRecoveryPhoto(org.springframework.web.multipart.MultipartFile file, String baseUrl) {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            // Reuse the delivery FileUploadUtil
            String uploadDir = "recovery";
            String uniqueName = generateUniqueName(fileName);
            String savedPath = com.appGate.delivery.utils.FileUploadUtil.saveImage(uploadDir, uniqueName, file);
            return baseUrl + "/api/goods-recovery/image/" + savedPath;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload recovery photo", e);
        }
    }

    private String generateUniqueName(String originalFileName) {
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
        }
        return "recovery_" + System.currentTimeMillis() + extension;
    }

    private String getBaseUrl(HttpServletRequest request) {
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedProto = request.getHeader("X-Forwarded-Proto");

        StringBuilder url = new StringBuilder();

        if (forwardedProto != null) {
            url.append(forwardedProto).append("://");
        } else {
            url.append(request.getScheme()).append("://");
        }

        if (forwardedHost != null) {
            url.append(forwardedHost);
        } else {
            url.append(request.getServerName());
            if (request.getServerPort() != 80 && request.getServerPort() != 443) {
                url.append(":").append(request.getServerPort());
            }
        }

        return url.toString();
    }
}

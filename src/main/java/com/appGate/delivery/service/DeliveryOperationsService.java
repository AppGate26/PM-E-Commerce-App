package com.appGate.delivery.service;

import com.appGate.delivery.dto.*;
import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.DeliveryConfirmation;
import com.appGate.delivery.models.DeliveryFeedback;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.DeliveryConfirmationRepository;
import com.appGate.delivery.repository.DeliveryFeedbackRepository;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.delivery.utils.FileUploadUtil;
import com.appGate.inventory.models.Product;
import com.appGate.inventory.repository.ProductRepository;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DeliveryOperationsService {

    private final RiderBoxRepository riderBoxRepository;
    private final DeliveryConfirmationRepository deliveryConfirmationRepository;
    private final DeliveryFeedbackRepository deliveryFeedbackRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public DeliveryOperationsService(
            RiderBoxRepository riderBoxRepository,
            DeliveryConfirmationRepository deliveryConfirmationRepository,
            DeliveryFeedbackRepository deliveryFeedbackRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {
        this.riderBoxRepository = riderBoxRepository;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.deliveryFeedbackRepository = deliveryFeedbackRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public BaseResponse getPendingDeliveries(Long riderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<RiderBox> riderBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.PENDING, pageable);

        List<PendingDeliveryDto> deliveries = riderBoxes.getContent().stream()
                .map(this::mapToPendingDeliveryDto)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", deliveries);
        response.put("totalPages", riderBoxes.getTotalPages());
        response.put("totalElements", riderBoxes.getTotalElements());
        response.put("currentPage", riderBoxes.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Pending deliveries retrieved successfully", response);
    }

    public BaseResponse getDeliveryDetails(Long riderBoxId) {
        RiderBox riderBox = riderBoxRepository.findById(riderBoxId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));

        PendingDeliveryDto dto = mapToPendingDeliveryDto(riderBox);

        return new BaseResponse(HttpStatus.OK.value(), "Delivery details retrieved successfully", dto);
    }

    @Transactional
    public BaseResponse confirmDelivery(DeliveryConfirmationDto dto, HttpServletRequest request) {
        RiderBox riderBox = riderBoxRepository.findById(dto.getRiderBoxId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));

        if (!riderBox.getStatus().equals(RiderBoxStatusEnum.ACCEPTED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery must be accepted before confirmation");
        }

        DeliveryConfirmation confirmation = new DeliveryConfirmation();
        confirmation.setRiderBoxId(dto.getRiderBoxId());
        confirmation.setDeliveryAgentName(dto.getDeliveryAgentName());
        confirmation.setDeliveryAddress(dto.getDeliveryAddress());
        confirmation.setItemOfDelivery(dto.getItemOfDelivery());
        confirmation.setTimeOfDelivery(dto.getTimeOfDelivery() != null ? dto.getTimeOfDelivery() : LocalDateTime.now());

        // Upload proof of delivery image
        if (dto.getProofOfDeliveryImage() != null && !dto.getProofOfDeliveryImage().isEmpty()) {
            String imageUrl = saveImage(dto.getProofOfDeliveryImage(), "delivery", getBaseUrl(request));
            confirmation.setProofOfDeliveryImage(imageUrl);
        }

        deliveryConfirmationRepository.save(confirmation);

        // Update RiderBox status
        riderBox.setStatus(RiderBoxStatusEnum.DELIVERED);
        riderBoxRepository.save(riderBox);

        // Update Order delivery status
        if (riderBox.getOrderId() != null) {
            Order order = orderRepository.findById(riderBox.getOrderId()).orElse(null);
            if (order != null) {
                order.setDeliveryStatus(DeliveryStatus.DELIVERED);
                order.setDeliveredAt(LocalDateTime.now());
                orderRepository.save(order);
            }
        }

        return new BaseResponse(HttpStatus.OK.value(), "Delivery confirmed successfully", confirmation);
    }

    @Transactional
    public BaseResponse submitFeedback(DeliveryFeedbackDto dto) {
        RiderBox riderBox = riderBoxRepository.findById(dto.getRiderBoxId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));

        DeliveryConfirmation confirmation = deliveryConfirmationRepository.findByRiderBoxId(dto.getRiderBoxId())
                .orElse(null);

        DeliveryFeedback feedback = new DeliveryFeedback();
        feedback.setRiderBoxId(dto.getRiderBoxId());
        feedback.setDeliveryConfirmationId(confirmation != null ? confirmation.getId() : null);
        feedback.setDeliveryAgentName(dto.getDeliveryAgentName());
        feedback.setProductId(dto.getProductId());
        feedback.setCustomerName(dto.getCustomerName());
        feedback.setStatus(dto.getStatus());

        deliveryFeedbackRepository.save(feedback);

        return new BaseResponse(HttpStatus.OK.value(), "Feedback submitted successfully", feedback);
    }

    public BaseResponse getDeliveryHistory(Long riderId, LocalDate startDate, LocalDate endDate,
                                           String search, int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());

        // For now, get all delivered items for this rider
        Page<RiderBox> deliveredBoxes = riderBoxRepository.findByRiderIdAndStatus(
                riderId, RiderBoxStatusEnum.DELIVERED, pageable);

        List<Map<String, Object>> history = deliveredBoxes.getContent().stream()
                .map(this::mapToDeliveryHistory)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", history);
        response.put("totalPages", deliveredBoxes.getTotalPages());
        response.put("totalElements", deliveredBoxes.getTotalElements());
        response.put("currentPage", deliveredBoxes.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Delivery history retrieved successfully", response);
    }

    private PendingDeliveryDto mapToPendingDeliveryDto(RiderBox riderBox) {
        PendingDeliveryDto dto = new PendingDeliveryDto();
        dto.setRiderBoxId(riderBox.getRiderBoxId());
        dto.setOrderId(riderBox.getOrderId());
        dto.setSaleRef(riderBox.getSaleRef());
        dto.setStatus(riderBox.getStatus().name());

        // Get order details
        if (riderBox.getOrderId() != null) {
            Order order = orderRepository.findById(riderBox.getOrderId()).orElse(null);
            if (order != null) {
                dto.setDeliveryAddress(order.getDeliveryAddress());
                dto.setCustomerPhone(order.getDeliveryPhone());

                // Get customer name
                User user = userRepository.findById(order.getUserId()).orElse(null);
                if (user != null) {
                    dto.setCustomerName(user.getFirstName() + " " + user.getLastName());
                }

                // Get product details from order items
                if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                    OrderItem firstItem = order.getOrderItems().get(0);
                    Product product = productRepository.findById(firstItem.getProductId()).orElse(null);
                    if (product != null) {
                        dto.setProductName(product.getProductName());
                        dto.setProductImage(product.getProductImage());
                    }
                }
            }
        }

        return dto;
    }

    private Map<String, Object> mapToDeliveryHistory(RiderBox riderBox) {
        Map<String, Object> history = new HashMap<>();
        history.put("riderBoxId", riderBox.getRiderBoxId());
        history.put("deliveryDate", riderBox.getUpdatedAt() != null ? riderBox.getUpdatedAt().toLocalDate() : null);

        DeliveryConfirmation confirmation = deliveryConfirmationRepository.findByRiderBoxId(riderBox.getRiderBoxId()).orElse(null);
        if (confirmation != null) {
            history.put("deliveryAgentName", confirmation.getDeliveryAgentName());
            history.put("deliveryAddress", confirmation.getDeliveryAddress());
        }

        // Get order details
        if (riderBox.getOrderId() != null) {
            Order order = orderRepository.findById(riderBox.getOrderId()).orElse(null);
            if (order != null) {
                User user = userRepository.findById(order.getUserId()).orElse(null);
                if (user != null) {
                    history.put("customerName", user.getFirstName() + " " + user.getLastName());
                }

                if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                    OrderItem firstItem = order.getOrderItems().get(0);
                    Product product = productRepository.findById(firstItem.getProductId()).orElse(null);
                    if (product != null) {
                        history.put("productName", product.getProductName());
                    }
                }
            }
        }

        history.put("status", "DELIVERED");

        return history;
    }

    private String saveImage(org.springframework.web.multipart.MultipartFile file, String uploadDir, String baseUrl) {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        try {
            String savedPath = FileUploadUtil.saveImage(uploadDir, FileUploadUtil.generateUniqueName(fileName), file);
            return baseUrl + "/api/users/rider/image/" + savedPath;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image", e);
        }
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

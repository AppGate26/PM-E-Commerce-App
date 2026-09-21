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
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.models.OrderItem;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.service.MobileSalesOrderSyncService;
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
import java.util.Comparator;
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
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;

    public DeliveryOperationsService(
            RiderBoxRepository riderBoxRepository,
            DeliveryConfirmationRepository deliveryConfirmationRepository,
            DeliveryFeedbackRepository deliveryFeedbackRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            MobileSalesOrderSyncService mobileSalesOrderSyncService) {
        this.riderBoxRepository = riderBoxRepository;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.deliveryFeedbackRepository = deliveryFeedbackRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.mobileSalesOrderSyncService = mobileSalesOrderSyncService;
    }

    /**
     * Every box read/write goes through here. Riders are not posted to a branch -
     * they can be handed a delivery from any branch - so this only checks that the
     * box exists, not that it matches the caller's branch (unlike the admin-facing
     * branch-scoped services).
     */
    private RiderBox boxInScope(Long riderBoxId) {
        return riderBoxRepository.findById(riderBoxId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found"));
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
        RiderBox riderBox = boxInScope(riderBoxId);

        PendingDeliveryDto dto = mapToPendingDeliveryDto(riderBox);

        return new BaseResponse(HttpStatus.OK.value(), "Delivery details retrieved successfully", dto);
    }

    @Transactional
    public BaseResponse confirmDelivery(DeliveryConfirmationDto dto, HttpServletRequest request) {
        RiderBox riderBox = boxInScope(dto.getRiderBoxId());

        // The delivery-agent mobile app has no separate "accept" call (that only exists as
        // the admin-facing PUT /api/admin/accept/{riderBoxId}) - it goes straight from viewing
        // a pending delivery to confirming it. Requiring ACCEPTED here meant every real
        // confirmation from the app failed with this same 400, since the box was still
        // PENDING. REJECTED/DELIVERED are still refused: a rejected box shouldn't be
        // confirmable, and a delivered one has already been confirmed once.
        if (riderBox.getStatus() == RiderBoxStatusEnum.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery was rejected and cannot be confirmed");
        }
        if (riderBox.getStatus() == RiderBoxStatusEnum.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery has already been confirmed");
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

        // Update the order's status and mirror it onto the admin-facing SalesOrder -
        // see MobileSalesOrderSyncService.markOrderDelivered.
        if (riderBox.getOrderId() != null) {
            mobileSalesOrderSyncService.markOrderDelivered(riderBox.getOrderId());
        }

        return new BaseResponse(HttpStatus.OK.value(), "Delivery confirmed successfully", confirmation);
    }

    @Transactional
    public BaseResponse submitFeedback(DeliveryFeedbackDto dto) {
        boxInScope(dto.getRiderBoxId());

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
        // startDate/endDate/search used to be accepted but silently ignored ("get all delivered
        // items for this rider", unconditionally) - a rider filtering their history got back the
        // same unfiltered list every time. RiderBox itself doesn't carry the customer/product
        // name search needs, so filtering happens after mapping (below) rather than in the
        // repository query, then the page is sliced out of the filtered result.
        List<RiderBox> deliveredBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.DELIVERED);

        Comparator<RiderBox> comparator = "updatedAt".equalsIgnoreCase(sortBy) || "deliveryDate".equalsIgnoreCase(sortBy)
                ? Comparator.comparing(RiderBox::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                : Comparator.comparing(RiderBox::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));

        List<Map<String, Object>> allHistory = deliveredBoxes.stream()
                .sorted(comparator.reversed())
                .map(this::mapToDeliveryHistory)
                .filter(entry -> matchesDateRange(entry, startDate, endDate))
                .filter(entry -> matchesSearch(entry, search))
                .collect(Collectors.toList());

        int totalElements = allHistory.size();
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<Map<String, Object>> pageContent = allHistory.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageContent);
        response.put("totalPages", totalPages);
        response.put("totalElements", (long) totalElements);
        response.put("currentPage", page);

        return new BaseResponse(HttpStatus.OK.value(), "Delivery history retrieved successfully", response);
    }

    private boolean matchesDateRange(Map<String, Object> entry, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return true;
        }
        LocalDate deliveryDate = (LocalDate) entry.get("deliveryDate");
        if (deliveryDate == null) {
            return false;
        }
        if (startDate != null && deliveryDate.isBefore(startDate)) {
            return false;
        }
        return endDate == null || !deliveryDate.isAfter(endDate);
    }

    private boolean matchesSearch(Map<String, Object> entry, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.trim().toLowerCase();
        return containsIgnoreCase(entry.get("customerName"), needle)
                || containsIgnoreCase(entry.get("productName"), needle)
                || containsIgnoreCase(entry.get("deliveryAddress"), needle);
    }

    private boolean containsIgnoreCase(Object value, String needle) {
        return value instanceof String s && s.toLowerCase().contains(needle);
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

                // Get product details from order items. An order can hold several products,
                // so surface all of them via `items` - productName/productImage above only
                // ever mirrored the first one, which hid the rest from the rider (see
                // PendingDeliveryDto).
                if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                    List<PendingDeliveryItemDto> items = order.getOrderItems().stream()
                            .map(this::mapToPendingDeliveryItemDto)
                            .collect(Collectors.toList());
                    dto.setItems(items);

                    PendingDeliveryItemDto firstItem = items.get(0);
                    dto.setProductName(firstItem.getProductName());
                    dto.setProductImage(firstItem.getProductImage());
                }
            }
        }

        return dto;
    }

    private PendingDeliveryItemDto mapToPendingDeliveryItemDto(OrderItem orderItem) {
        PendingDeliveryItemDto itemDto = new PendingDeliveryItemDto();
        itemDto.setProductId(orderItem.getProductId());
        itemDto.setProductName(orderItem.getProductName());
        itemDto.setProductImage(orderItem.getProductImage());
        itemDto.setQuantity(orderItem.getQuantity());
        itemDto.setUnitPrice(orderItem.getUnitPrice());
        itemDto.setSubtotal(orderItem.getSubtotal());
        return itemDto;
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
                    List<PendingDeliveryItemDto> items = order.getOrderItems().stream()
                            .map(this::mapToPendingDeliveryItemDto)
                            .collect(Collectors.toList());
                    history.put("items", items);
                    history.put("productName", items.get(0).getProductName());
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

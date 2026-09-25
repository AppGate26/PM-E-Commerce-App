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
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import com.appGate.orderingsales.service.MobileSalesOrderSyncService;
import com.appGate.rbac.service.BranchScopeService;
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
    private final SalesOrderRepository salesOrderRepository;
    private final MobileSalesOrderSyncService mobileSalesOrderSyncService;
    private final RiderBoxDetailsResolver detailsResolver;
    private final DeliveryNotificationService deliveryNotificationService;
    private final BranchScopeService branchScopeService;

    public DeliveryOperationsService(
            RiderBoxRepository riderBoxRepository,
            DeliveryConfirmationRepository deliveryConfirmationRepository,
            DeliveryFeedbackRepository deliveryFeedbackRepository,
            OrderRepository orderRepository,
            SalesOrderRepository salesOrderRepository,
            MobileSalesOrderSyncService mobileSalesOrderSyncService,
            RiderBoxDetailsResolver detailsResolver,
            DeliveryNotificationService deliveryNotificationService,
            BranchScopeService branchScopeService) {
        this.riderBoxRepository = riderBoxRepository;
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.deliveryFeedbackRepository = deliveryFeedbackRepository;
        this.orderRepository = orderRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.mobileSalesOrderSyncService = mobileSalesOrderSyncService;
        this.detailsResolver = detailsResolver;
        this.deliveryNotificationService = deliveryNotificationService;
        this.branchScopeService = branchScopeService;
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

    // Everything the rider still has to deliver. ACCEPTED used to be missing here, so a box an
    // admin accepted on the web vanished from the rider app (it isn't in history either, which
    // is DELIVERED only). IN_TRANSIT is the rider's own "on the way" state - see startDelivery.
    private static final List<RiderBoxStatusEnum> OPEN_STATUSES = List.of(
            RiderBoxStatusEnum.PENDING, RiderBoxStatusEnum.ACCEPTED, RiderBoxStatusEnum.IN_TRANSIT);

    public BaseResponse getPendingDeliveries(Long riderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<RiderBox> riderBoxes = riderBoxRepository.findByRiderIdAndStatusIn(riderId, OPEN_STATUSES, pageable);

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

    /**
     * Rider taps "Start delivery": the box goes IN_TRANSIT, and so does the order behind it.
     * For a mobile order that is the same transition as the admin SHIPPED status update
     * (OrderService.updateOrderStatus) - orderStatus SHIPPED, deliveryStatus IN_TRANSIT,
     * shippedAt stamped - so the customer app and the web Transit page both pick it up.
     * Calling it again on a box already in transit is a no-op.
     */
    @Transactional
    public BaseResponse startDelivery(Long riderBoxId) {
        RiderBox riderBox = boxInScope(riderBoxId);

        if (riderBox.getStatus() == RiderBoxStatusEnum.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery was rejected and cannot be started");
        }
        if (riderBox.getStatus() == RiderBoxStatusEnum.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery has already been confirmed");
        }
        if (riderBox.getStatus() == RiderBoxStatusEnum.IN_TRANSIT) {
            return new BaseResponse(HttpStatus.OK.value(), "Delivery already in transit", detailsResolver.resolve(riderBox));
        }

        riderBox.setStatus(RiderBoxStatusEnum.IN_TRANSIT);
        riderBoxRepository.save(riderBox);

        if (riderBox.getOrderId() != null) {
            orderRepository.findById(riderBox.getOrderId()).ifPresent(order -> {
                order.setOrderStatus(OrderStatus.SHIPPED);
                order.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);
                if (order.getShippedAt() == null) {
                    order.setShippedAt(LocalDateTime.now());
                }
                orderRepository.save(order);
            });
            // Mirror onto the admin-facing SalesOrder. Done directly rather than through
            // syncOrderStatus, which throws when an older order has no mirror - that shouldn't
            // stop a rider from setting off.
            salesOrderRepository.findByMobileOrderId(riderBox.getOrderId()).ifPresent(mirror -> {
                mirror.setStatus(OrderStatus.SHIPPED);
                salesOrderRepository.save(mirror);
            });
        } else if (riderBox.getSalesOrderId() != null) {
            salesOrderRepository.findById(riderBox.getSalesOrderId()).ifPresent(salesOrder -> {
                salesOrder.setStatus(OrderStatus.SHIPPED);
                salesOrderRepository.save(salesOrder);
            });
        }

        PendingDeliveryDto details = detailsResolver.resolve(riderBox);
        deliveryNotificationService.notifyRiderBoxEvent(riderBox, details, "IN_TRANSIT",
                describe(details) + " is on the way" + riderSuffix(details));

        return new BaseResponse(HttpStatus.OK.value(), "Delivery started", details);
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
        } else if (riderBox.getSalesOrderId() != null) {
            // Walk-in sale: no mobile Order to go through - mark the SalesOrder itself
            // delivered, the same way RiderBoxService.deliverProduct does.
            salesOrderRepository.findById(riderBox.getSalesOrderId()).ifPresent(salesOrder -> {
                salesOrder.setStatus(OrderStatus.DELIVERED);
                salesOrderRepository.save(salesOrder);
            });
        }

        PendingDeliveryDto details = detailsResolver.resolve(riderBox);
        deliveryNotificationService.notifyRiderBoxEvent(riderBox, details, "DELIVERED",
                describe(details) + " has been delivered" + riderSuffix(details));

        return new BaseResponse(HttpStatus.OK.value(), "Delivery confirmed successfully", confirmation);
    }

    @Transactional
    public BaseResponse submitFeedback(DeliveryFeedbackDto dto) {
        RiderBox riderBox = boxInScope(dto.getRiderBoxId());
        PendingDeliveryDto details = detailsResolver.resolve(riderBox);

        DeliveryConfirmation confirmation = deliveryConfirmationRepository.findByRiderBoxId(dto.getRiderBoxId())
                .orElse(null);

        // Rider name, product and customer come from the delivery itself rather than being
        // typed by the rider - the app's values are only used when the box can't supply one.
        DeliveryFeedback feedback = new DeliveryFeedback();
        feedback.setRiderBoxId(dto.getRiderBoxId());
        feedback.setDeliveryConfirmationId(confirmation != null ? confirmation.getId() : null);
        feedback.setDeliveryAgentName(firstNonBlank(details.getRiderName(), dto.getDeliveryAgentName()));
        feedback.setProductId(details.getProductId() != null ? details.getProductId() : dto.getProductId());
        feedback.setCustomerName(firstNonBlank(details.getCustomerName(), dto.getCustomerName()));
        feedback.setStatus(dto.getStatus());

        deliveryFeedbackRepository.save(feedback);

        return new BaseResponse(HttpStatus.OK.value(), "Feedback submitted successfully", feedback);
    }

    /**
     * Rider-submitted feedback for the web Feedback Notification page. Each row is joined back
     * to its rider box for the product/customer/quantity the page shows. Branch-scoped
     * through the box, the same way the other admin delivery lists are.
     */
    public BaseResponse getAllFeedback() {
        Long branchId = branchScopeService.getScopedBranchId();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (DeliveryFeedback feedback : deliveryFeedbackRepository.findAllByOrderByCreatedAtDesc()) {
            RiderBox riderBox = riderBoxRepository.findById(feedback.getRiderBoxId()).orElse(null);
            if (branchId != null && (riderBox == null || !branchId.equals(riderBox.getBranchId()))) {
                continue;
            }
            PendingDeliveryDto details = riderBox != null ? detailsResolver.resolve(riderBox) : null;

            Map<String, Object> row = new HashMap<>();
            row.put("id", feedback.getId());
            row.put("riderBoxId", feedback.getRiderBoxId());
            row.put("orderId", details != null ? details.getOrderId() : null);
            row.put("salesReference", details != null ? details.getSalesReference() : null);
            row.put("productId", feedback.getProductId() != null ? feedback.getProductId()
                    : details != null ? details.getProductId() : null);
            row.put("productName", details != null ? details.getProductName() : null);
            row.put("riderId", riderBox != null ? riderBox.getRiderId() : null);
            row.put("riderName", firstNonBlank(feedback.getDeliveryAgentName(),
                    details != null ? details.getRiderName() : null));
            row.put("customerName", firstNonBlank(feedback.getCustomerName(),
                    details != null ? details.getCustomerName() : null));
            row.put("deliveryAddress", details != null ? details.getDeliveryAddress() : null);
            row.put("quantityDelivered", details != null && details.getItems() != null
                    ? details.getItems().stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum()
                    : null);
            row.put("status", feedback.getStatus() != null ? feedback.getStatus().name() : null);
            row.put("createdAt", feedback.getCreatedAt());
            rows.add(row);
        }

        return new BaseResponse(HttpStatus.OK.value(), "Delivery feedback retrieved successfully", rows);
    }

    private static String firstNonBlank(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }

    // "Order #12 (Samsung A15) for John Doe" - used in notification messages.
    static String describe(PendingDeliveryDto details) {
        StringBuilder sb = new StringBuilder("Order");
        if (details.getSalesReference() != null) {
            sb.append(" ").append(details.getSalesReference());
        } else if (details.getOrderId() != null) {
            sb.append(" #").append(details.getOrderId());
        }
        if (details.getProductName() != null) {
            sb.append(" (").append(details.getProductName()).append(")");
        }
        if (details.getCustomerName() != null) {
            sb.append(" for ").append(details.getCustomerName());
        }
        return sb.toString();
    }

    private static String riderSuffix(PendingDeliveryDto details) {
        return details.getRiderName() != null ? " - rider " + details.getRiderName() : "";
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
        return detailsResolver.resolve(riderBox);
    }

    private Map<String, Object> mapToDeliveryHistory(RiderBox riderBox) {
        PendingDeliveryDto details = detailsResolver.resolve(riderBox);

        Map<String, Object> history = new HashMap<>();
        history.put("riderBoxId", riderBox.getRiderBoxId());
        history.put("deliveryDate", riderBox.getUpdatedAt() != null ? riderBox.getUpdatedAt().toLocalDate() : null);
        history.put("customerName", details.getCustomerName());
        history.put("deliveryAddress", details.getDeliveryAddress());
        history.put("deliveryAgentName", details.getRiderName());
        history.put("items", details.getItems());
        history.put("productId", details.getProductId());
        history.put("productName", details.getProductName());

        // What the rider actually recorded at the door wins over the order's own values.
        DeliveryConfirmation confirmation = deliveryConfirmationRepository.findByRiderBoxId(riderBox.getRiderBoxId()).orElse(null);
        if (confirmation != null) {
            history.put("deliveryAgentName", confirmation.getDeliveryAgentName());
            history.put("deliveryAddress", confirmation.getDeliveryAddress());
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

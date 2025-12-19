package com.appGate.delivery.service;

import com.appGate.delivery.enums.RiderBoxStatusEnum;
import com.appGate.delivery.models.Rider;
import com.appGate.delivery.models.RiderBox;
import com.appGate.delivery.repository.RiderBoxRepository;
import com.appGate.delivery.repository.RiderRepository;
import com.appGate.delivery.response.BaseResponse;
import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DeliveryReportService {

    private final RiderBoxRepository riderBoxRepository;
    private final RiderRepository riderRepository;
    private final OrderRepository orderRepository;

    public DeliveryReportService(
            RiderBoxRepository riderBoxRepository,
            RiderRepository riderRepository,
            OrderRepository orderRepository) {
        this.riderBoxRepository = riderBoxRepository;
        this.riderRepository = riderRepository;
        this.orderRepository = orderRepository;
    }

    // Get rider box report for a specific rider
    public BaseResponse getRiderBoxReport(Long riderId, int page, int size) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<RiderBox> riderBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.DELIVERED, pageable);

        Map<String, Object> report = new HashMap<>();
        report.put("riderId", riderId);
        report.put("riderName", rider.getSurName() + " " + rider.getOtherName());
        report.put("totalDeliveries", riderBoxes.getTotalElements());
        report.put("deliveries", riderBoxes.getContent());
        report.put("totalPages", riderBoxes.getTotalPages());
        report.put("currentPage", riderBoxes.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Rider box report retrieved successfully", report);
    }

    // Get rider information report - all riders with stats
    public BaseResponse getRiderInfoReport(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Rider> riders = riderRepository.findAll(pageable);

        List<Map<String, Object>> riderReports = riders.getContent().stream()
                .map(this::mapRiderToReport)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", riderReports);
        response.put("totalPages", riders.getTotalPages());
        response.put("totalElements", riders.getTotalElements());
        response.put("currentPage", riders.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Rider information report retrieved successfully", response);
    }

    // Get transit deliveries report
    public BaseResponse getTransitReport(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("shippedAt").descending());
        Page<Order> transitOrders = orderRepository.findByDeliveryStatusIn(
                List.of(DeliveryStatus.IN_TRANSIT, DeliveryStatus.IN_TRANSIT),
                pageable
        );

        Map<String, Object> report = new HashMap<>();
        report.put("content", transitOrders.getContent());
        report.put("totalPages", transitOrders.getTotalPages());
        report.put("totalElements", transitOrders.getTotalElements());
        report.put("currentPage", transitOrders.getNumber());

        return new BaseResponse(HttpStatus.OK.value(), "Transit deliveries report retrieved successfully", report);
    }

    // Get all deliveries report
    public BaseResponse getDeliveriesReport(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("deliveredAt").descending());
        List<Order> deliveredOrders = orderRepository.findByDeliveryStatus(DeliveryStatus.DELIVERED);

        Map<String, Object> report = new HashMap<>();
        report.put("totalDeliveries", deliveredOrders.size());
        report.put("deliveries", deliveredOrders.stream()
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList()));
        report.put("totalPages", (int) Math.ceil((double) deliveredOrders.size() / size));
        report.put("currentPage", page);

        return new BaseResponse(HttpStatus.OK.value(), "Deliveries report retrieved successfully", report);
    }

    // Get rider box display options for a specific rider
    public BaseResponse getRiderBoxDisplay(Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rider not found"));

        List<RiderBox> pendingBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.PENDING);
        List<RiderBox> acceptedBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.ACCEPTED);
        List<RiderBox> deliveredBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.DELIVERED);
        List<RiderBox> rejectedBoxes = riderBoxRepository.findByRiderIdAndStatus(riderId, RiderBoxStatusEnum.REJECTED);

        Map<String, Object> display = new HashMap<>();
        display.put("riderId", riderId);
        display.put("riderName", rider.getSurName() + " " + rider.getOtherName());
        display.put("pendingCount", pendingBoxes.size());
        display.put("acceptedCount", acceptedBoxes.size());
        display.put("deliveredCount", deliveredBoxes.size());
        display.put("rejectedCount", rejectedBoxes.size());
        display.put("pendingBoxes", pendingBoxes);
        display.put("acceptedBoxes", acceptedBoxes);
        display.put("deliveredBoxes", deliveredBoxes);
        display.put("rejectedBoxes", rejectedBoxes);

        return new BaseResponse(HttpStatus.OK.value(), "Rider box display data retrieved successfully", display);
    }

    private Map<String, Object> mapRiderToReport(Rider rider) {
        Map<String, Object> report = new HashMap<>();
        report.put("riderId", rider.getRiderId());
        report.put("name", rider.getSurName() + " " + rider.getOtherName());
        report.put("email", rider.getEmail());
        report.put("phoneNumber", rider.getPhoneNumber());
        report.put("suspended", rider.getSuspended());

        // Get rider statistics
        List<RiderBox> allBoxes = riderBoxRepository.findByRiderIdAndStatus(rider.getRiderId(), RiderBoxStatusEnum.DELIVERED);
        report.put("totalDeliveries", allBoxes.size());

        List<RiderBox> pendingBoxes = riderBoxRepository.findByRiderIdAndStatus(rider.getRiderId(), RiderBoxStatusEnum.PENDING);
        report.put("pendingDeliveries", pendingBoxes.size());

        return report;
    }
}

package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.enums.DeliveryStatus;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.models.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Page<Order> findByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus, Pageable pageable);

    List<Order> findByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus);

    Page<Order> findByOrderStatus(OrderStatus orderStatus, Pageable pageable);

    List<Order> findByRiderId(Long riderId);

    Page<Order> findByRiderIdAndOrderStatus(Long riderId, OrderStatus orderStatus, Pageable pageable);

    Long countByUserId(Long userId);

    Long countByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus);

    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    Page<Order> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<Order> findByDeliveryStatusIn(List<DeliveryStatus> deliveryStatuses, Pageable pageable);

    List<Order> findByDeliveryStatus(DeliveryStatus deliveryStatus);

    // --- Branch-scoped ---
    // The branch column was already written on checkout but nothing ever read it,
    // so every branch saw every branch's orders.
    Page<Order> findByBranchId(Long branchId, Pageable pageable);

    Page<Order> findByBranchIdAndOrderStatus(Long branchId, OrderStatus orderStatus, Pageable pageable);

    Page<Order> findByBranchIdAndDeliveryStatusIn(
            Long branchId, List<DeliveryStatus> deliveryStatuses, Pageable pageable);

    List<Order> findByBranchIdAndDeliveryStatus(Long branchId, DeliveryStatus deliveryStatus);

    List<Order> findByBranchIdAndCreatedAtBetween(
            Long branchId, LocalDateTime startDate, LocalDateTime endDate);
}

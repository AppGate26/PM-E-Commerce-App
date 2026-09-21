package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long>, JpaSpecificationExecutor<OrderItem> {

    List<OrderItem> findByOrderId(Long orderId);

    // Walk-in/online SalesOrder line items (Phase 2 of the order/SalesOrder
    // unification) - see OrderItem.salesOrderId.
    List<OrderItem> findBySalesOrderId(Long salesOrderId);

    List<OrderItem> findByProductId(Long productId);
}

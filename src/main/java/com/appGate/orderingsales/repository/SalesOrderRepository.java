package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.enums.CustomerType;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.enums.SalesOrderType;
import com.appGate.orderingsales.models.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    Optional<SalesOrder> findByReferenceNo(String referenceNo);

    Page<SalesOrder> findByCustomerId(Long customerId, Pageable pageable);

    Page<SalesOrder> findByCustomerType(CustomerType customerType, Pageable pageable);

    Page<SalesOrder> findByOrderType(SalesOrderType orderType, Pageable pageable);

    Page<SalesOrder> findByStatus(OrderStatus status, Pageable pageable);

    // Customer type and order type combinations
    Page<SalesOrder> findByCustomerTypeAndOrderType(CustomerType customerType, SalesOrderType orderType, Pageable pageable);

    // Date range queries
    Page<SalesOrder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<SalesOrder> findByCustomerTypeAndCreatedAtBetween(CustomerType customerType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<SalesOrder> findByOrderTypeAndCreatedAtBetween(SalesOrderType orderType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<SalesOrder> findByCustomerTypeAndOrderTypeAndCreatedAtBetween(
            CustomerType customerType, SalesOrderType orderType,
            LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Status queries
    Page<SalesOrder> findByCustomerTypeAndStatus(CustomerType customerType, OrderStatus status, Pageable pageable);

    // Online customer reports
    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'ONLINE' AND s.orderType = 'INSTALLMENT' " +
           "AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findOnlineInstallmentOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'ONLINE' AND s.orderType = 'ONE_OFF' " +
           "AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findOnlineOneOffOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Walk-in customer reports
    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'WALKIN' AND s.orderType = 'CREDIT' " +
           "AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findWalkInCreditOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'WALKIN' AND s.orderType = 'CASH' " +
           "AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findWalkInCashOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Count queries
    Long countByCustomerType(CustomerType customerType);

    Long countByOrderType(SalesOrderType orderType);

    Long countByStatus(OrderStatus status);

    // Search by account number
    List<SalesOrder> findByAccountNumber(String accountNumber);

    // Pending refunds
    List<SalesOrder> findByStatusAndIsRefunded(OrderStatus status, Boolean isRefunded);
}

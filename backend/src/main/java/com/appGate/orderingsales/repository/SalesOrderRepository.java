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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    Optional<SalesOrder> findByReferenceNo(String referenceNo);

    // Looks up the mirror SalesOrder created for a mobile-app checkout (see
    // MobileSalesOrderSyncService) so part-payments can be synced back onto it.
    Optional<SalesOrder> findByMobileOrderId(Long mobileOrderId);

    // Orders ready to be handed to a rider (Rider Box Management's "Order Reference"
    // dropdown): either an admin-approved online order mirrored from the mobile app
    // (mobileOrderId IS NOT NULL - what RiderBoxService.assignProduct hands to
    // RiderBox.orderId, resolved against the mobile Order table by the rider-facing
    // delivery endpoints), or any walk-in order that has reached PROCESSING (assigned
    // via RiderBox.salesOrderId directly, since there's no mobile Order to key off) - in
    // both cases only when fulfillmentType is DELIVERY, since a PICKUP order has nothing
    // for a rider to deliver.
    @Query("SELECT s FROM SalesOrder s WHERE " +
           "((s.customerType = com.appGate.orderingsales.enums.CustomerType.ONLINE AND s.mobileOrderId IS NOT NULL) " +
           "OR s.customerType = com.appGate.orderingsales.enums.CustomerType.WALKIN) " +
           "AND s.status = com.appGate.orderingsales.enums.OrderStatus.PROCESSING " +
           "AND s.fulfillmentType = com.appGate.orderingsales.enums.FulfillmentType.DELIVERY " +
           "ORDER BY s.createdAt DESC")
    Page<SalesOrder> findOrdersReadyForRiderAssignment(Pageable pageable);

    boolean existsBySalesReference(String salesReference);

    // Idempotency guard for the Paystack walk-in-cash verify flow: each item in a
    // paid cart gets salesReference = "<paystackReference>-<index>", so this finds
    // every order already created for a given Paystack reference on a repeat/refresh
    // callback, without needing a separate payment-tracking table.
    List<SalesOrder> findBySalesReferenceStartingWith(String prefix);

    // Branch-scoped sales (Branch module: branch sales view + report)
    List<SalesOrder> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<SalesOrder> findByBranchIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long branchId, LocalDateTime startDate, LocalDateTime endDate);

    // Paged branch-scoped report queries (used to auto-restrict reports to a
    // branch user's own branch).
    Page<SalesOrder> findByBranchId(Long branchId, Pageable pageable);

    Page<SalesOrder> findByBranchIdAndCreatedAtBetween(
            Long branchId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<SalesOrder> findByBranchIdAndOrderType(Long branchId, SalesOrderType orderType, Pageable pageable);

    Page<SalesOrder> findByBranchIdAndOrderTypeAndCreatedAtBetween(
            Long branchId, SalesOrderType orderType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<SalesOrder> findByCustomerId(Long customerId, Pageable pageable);

    Page<SalesOrder> findByCustomerType(CustomerType customerType, Pageable pageable);

    Page<SalesOrder> findByOrderType(SalesOrderType orderType, Pageable pageable);

    Page<SalesOrder> findByStatus(OrderStatus status, Pageable pageable);

    Page<SalesOrder> findByStatusAndBranchId(OrderStatus status, Long branchId, Pageable pageable);

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

    // Walk-in customer reports.
    // Compare the @Enumerated(STRING) fields against fully-qualified enum literals
    // rather than bare string literals ('WALKIN'/'CREDIT'): the latter can raise a
    // Hibernate SemanticException at runtime (surfacing as a 500 that the order
    // action screens report as "failed to load order").
    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = com.appGate.orderingsales.enums.CustomerType.WALKIN " +
           "AND s.orderType = com.appGate.orderingsales.enums.SalesOrderType.CREDIT " +
           "AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findWalkInCreditOrders(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = com.appGate.orderingsales.enums.CustomerType.WALKIN " +
           "AND s.orderType = com.appGate.orderingsales.enums.SalesOrderType.CASH " +
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

    // Payment tracking
    Page<SalesOrder> findByIsPaidFalseAndStatusNotIn(List<OrderStatus> statuses, Pageable pageable);
    // "Completed payments" backing query: orders that have had their sales reference
    // generated (SalesService.generateSalesReference) and have not yet been forwarded to
    // the admin approval queue. The screen's only action is "Send for approval"
    // (SalesService.submitOrderForApproval), so an order that has already been forwarded -
    // or that is dead - has nothing left to do here and drops off the list.
    //
    // The salesReference IS NOT NULL leg is the exact complement of
    // findAwaitingSalesReference's IS NULL leg below, so an order sits on "Order list as
    // paid" until its reference is minted and here afterwards - never in the gap between
    // the two. That only holds without an isPaid leg: generateSalesReference does not
    // touch isPaid, so requiring isPaid = true here stranded any order whose reference had
    // been minted while the flag was still false - off "Order list as paid" (reference is
    // no longer null) and not yet on this screen either.
    @Query("SELECT s FROM SalesOrder s WHERE s.salesReference IS NOT NULL "
            + "AND (s.status IS NULL OR s.status NOT IN :forwardedStatuses)")
    Page<SalesOrder> findReferencedOrdersNotYetSubmittedForApproval(
            @Param("forwardedStatuses") List<OrderStatus> forwardedStatuses, Pageable pageable);

    // "Order list as paid" backing query: orders that have crossed the >50%-paid mark
    // (reads the stored paymentProgress column directly, not the recomputed
    // resolvePaymentProgress figure - see SalesService.getOrdersAwaitingSalesReference)
    // and haven't had a sales reference generated yet. No isPaid/status filtering -
    // that's what was silently dropping eligible orders out of the old
    // incomplete-payments-derived list.
    //
    // ONE_OFF is excluded because those orders are handled on the "One of order" screen
    // instead (findOneOffOrdersAwaitingSalesReference below) - listing them here too
    // put the same order on two screens. The IS NULL leg matters: a bare
    // "orderType <> ONE_OFF" is unknown (not true) for a row with no orderType, which
    // would silently drop those rows - the exact failure this query was written to fix.
    @Query("SELECT s FROM SalesOrder s WHERE s.salesReference IS NULL "
            + "AND s.paymentProgress >= :paymentProgress "
            + "AND (s.orderType IS NULL "
            + "OR s.orderType <> com.appGate.orderingsales.enums.SalesOrderType.ONE_OFF)")
    Page<SalesOrder> findAwaitingSalesReference(
            @Param("paymentProgress") BigDecimal paymentProgress, Pageable pageable);

    // "Marking as paid" backing query: orders still under the 50%-paid mark, read
    // straight off the stored paymentProgress column - see
    // SalesService.getOrdersBelowHalfPaid, the <50% counterpart to
    // getOrdersAwaitingSalesReference above.
    Page<SalesOrder> findByPaymentProgressLessThan(BigDecimal paymentProgress, Pageable pageable);

    // "One of order" backing query: ONE_OFF orders that still need a sales reference - the
    // exact complement of what findAwaitingSalesReference excludes above, so a one-off order
    // is always on exactly one of the two screens, and it leaves this one for
    // "Completed payments" the moment generateSalesReference mints its reference.
    //
    // Deliberately no isPaid leg. Mobile one-off orders are mirrored in already settled
    // (MobileSalesOrderSyncService.createMirror copies the app's paid state: isPaid = true,
    // paidAt set, paymentProgress 100), so filtering on isPaid = false returns nothing at
    // all for them, while filtering on isPaid = true would hide the staff-entered one-off
    // orders (createOneOffOrder/createOnlineOneOffSales) that arrive unpaid and get settled
    // on this very screen. What both kinds have in common is the missing reference, so
    // that - and only that - is what this query keys on.
    //
    // No mobileOrderId leg either: that column is only ever stamped by createMirror, so
    // requiring it dropped every staff-entered one-off order off this screen while
    // findAwaitingSalesReference was already excluding them as belonging here.
    @Query("SELECT s FROM SalesOrder s WHERE s.orderType = com.appGate.orderingsales.enums.SalesOrderType.ONE_OFF "
            + "AND s.salesReference IS NULL "
            + "AND (s.status IS NULL OR s.status NOT IN :excludedStatuses)")
    Page<SalesOrder> findOneOffOrdersAwaitingSalesReference(
            @Param("excludedStatuses") List<OrderStatus> excludedStatuses, Pageable pageable);

    // Walk-in orders still eligible for a sales-initiated cancellation request (Cancel Order ->
    // Walk-in Customers tab).
    Page<SalesOrder> findByCustomerTypeAndIsPaidFalseAndStatusNotIn(
            CustomerType customerType, List<OrderStatus> statuses, Pageable pageable);

    // Refund/Return report
    Page<SalesOrder> findByIsRefundedTrue(Pageable pageable);
    Page<SalesOrder> findByIsRefundedTrueAndRefundedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Cancelled orders report
    Page<SalesOrder> findByStatusAndCancelledAtBetween(OrderStatus status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Branch-scoped report queries
    Page<SalesOrder> findByCustomerTypeAndBranchId(CustomerType customerType, Long branchId, Pageable pageable);

    Page<SalesOrder> findByCustomerTypeAndBranchIdAndCreatedAtBetween(
            CustomerType customerType, Long branchId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'ONLINE' AND s.orderType = 'INSTALLMENT' " +
           "AND s.branchId = :branchId AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findOnlineInstallmentOrdersByBranch(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("branchId") Long branchId,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = 'ONLINE' AND s.orderType = 'ONE_OFF' " +
           "AND s.branchId = :branchId AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findOnlineOneOffOrdersByBranch(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("branchId") Long branchId,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = com.appGate.orderingsales.enums.CustomerType.WALKIN " +
           "AND s.orderType = com.appGate.orderingsales.enums.SalesOrderType.CREDIT " +
           "AND s.branchId = :branchId AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findWalkInCreditOrdersByBranch(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("branchId") Long branchId,
            Pageable pageable);

    @Query("SELECT s FROM SalesOrder s WHERE s.customerType = com.appGate.orderingsales.enums.CustomerType.WALKIN " +
           "AND s.orderType = com.appGate.orderingsales.enums.SalesOrderType.CASH " +
           "AND s.branchId = :branchId AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<SalesOrder> findWalkInCashOrdersByBranch(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("branchId") Long branchId,
            Pageable pageable);
}

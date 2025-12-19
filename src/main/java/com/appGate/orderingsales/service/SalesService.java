package com.appGate.orderingsales.service;

import com.appGate.orderingsales.dto.*;
import com.appGate.orderingsales.enums.*;
import com.appGate.orderingsales.models.LoanDetails;
import com.appGate.orderingsales.models.SalesNotification;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.repository.LoanDetailsRepository;
import com.appGate.orderingsales.repository.SalesNotificationRepository;
import com.appGate.orderingsales.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesOrderRepository salesOrderRepository;
    private final LoanDetailsRepository loanDetailsRepository;
    private final SalesNotificationRepository salesNotificationRepository;

    // Generate unique reference number
    private String generateReferenceNo() {
        return "PROWIT" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    // ==================== ORDER CREATION ====================

    @Transactional
    public SalesOrder createOneOffOrder(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.ONE_OFF, CustomerType.ONLINE);
        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder createInstallmentOrder(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.INSTALLMENT, CustomerType.ONLINE);
        SalesOrder savedOrder = salesOrderRepository.save(order);

        // Create loan details if provided
        if (dto.getLoanInfo() != null) {
            LoanDetails loanDetails = createLoanDetails(savedOrder, dto.getLoanInfo());
            loanDetailsRepository.save(loanDetails);
        }

        return savedOrder;
    }

    @Transactional
    public SalesOrder createOnlineOneOffSales(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.ONE_OFF, CustomerType.ONLINE);
        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder createOnlineCreditSales(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.CREDIT, CustomerType.ONLINE);
        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder createWalkInCashSales(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.CASH, CustomerType.WALKIN);
        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder createWalkInCreditSales(SalesOrderDto dto) {
        SalesOrder order = createBaseSalesOrder(dto, SalesOrderType.CREDIT, CustomerType.WALKIN);
        SalesOrder savedOrder = salesOrderRepository.save(order);

        // Create loan details if provided
        if (dto.getLoanInfo() != null) {
            LoanDetails loanDetails = createLoanDetails(savedOrder, dto.getLoanInfo());
            loanDetailsRepository.save(loanDetails);
        }

        return savedOrder;
    }

    private SalesOrder createBaseSalesOrder(SalesOrderDto dto, SalesOrderType orderType, CustomerType customerType) {
        SalesOrder order = new SalesOrder();
        order.setReferenceNo(generateReferenceNo());
        order.setOrderType(orderType);
        order.setCustomerType(customerType);
        order.setStatus(OrderStatus.PENDING);

        // Set product info
        if (dto.getProductInfo() != null) {
            ProductInfoDto product = dto.getProductInfo();
            order.setProductName(product.getProductName());
            order.setCategory(product.getCategory());
            order.setSubCategory(product.getSubCategory());
            order.setDescription(product.getDescription());
            order.setUnitPrice(product.getPrice() != null ? product.getPrice() : product.getUnitPrice());
            order.setQuantity(product.getQuantity() != null ? product.getQuantity() : 1);
            order.setDiscount(product.getDiscount() != null ? product.getDiscount() : BigDecimal.ZERO);
            order.setCoupon(product.getCoupon());

            // Calculate total
            BigDecimal price = order.getUnitPrice() != null ? order.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
            int qty = order.getQuantity() != null ? order.getQuantity() : 1;
            order.setTotalAmount(price.multiply(BigDecimal.valueOf(qty)).subtract(discount));
        }

        // Set customer info
        if (dto.getCustomerInfo() != null) {
            CustomerInfoDto customer = dto.getCustomerInfo();
            order.setCustomerName(customer.getCustomerName());
            order.setAccountNumber(customer.getAccountNumber());
            order.setEmail(customer.getEmail());
            order.setPhoneNumber(customer.getPhoneNumber());
            order.setAddress(customer.getAddress());
            order.setCustomerBankAccount(customer.getCustomerBankAccount());
        }

        return order;
    }

    private LoanDetails createLoanDetails(SalesOrder order, LoanInfoDto loanInfo) {
        LoanDetails loan = new LoanDetails();
        loan.setSalesOrder(order);
        loan.setLoanType(loanInfo.getLoanType());
        loan.setProductAmount(loanInfo.getProductAmount());
        loan.setRepaymentMethod(loanInfo.getRepaymentMethod());
        loan.setDuration(loanInfo.getDuration());
        loan.setRate(loanInfo.getRate());
        loan.setInterestOnLoan(loanInfo.getInterestOnLoan());
        loan.setPrincipalRepayment(loanInfo.getPrincipalRepayment());
        loan.setOfficerInCharge(loanInfo.getOfficerInCharge());
        loan.setUpfrontCharges(loanInfo.getUpfrontCharges());

        // Parse dates
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (loanInfo.getStartDate() != null) {
            loan.setStartDate(LocalDate.parse(loanInfo.getStartDate(), formatter));
        }
        if (loanInfo.getExpirationDate() != null) {
            loan.setExpirationDate(LocalDate.parse(loanInfo.getExpirationDate(), formatter));
        }

        // Calculate total repayment
        if (loanInfo.getProductAmount() != null && loanInfo.getInterestOnLoan() != null) {
            loan.setTotalRepayment(loanInfo.getProductAmount().add(loanInfo.getInterestOnLoan()));
        }

        return loan;
    }

    // ==================== ORDER MANAGEMENT ====================

    @Transactional
    public SalesOrder markAsPaid(Long orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setIsPaid(true);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        order.setPaymentProgress(BigDecimal.valueOf(100));

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder processRefund(Long orderId, RefundDto refundDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setIsRefunded(true);
        order.setRefundedAt(LocalDateTime.now());
        order.setRefundAmount(refundDto.getAmountToRefund());
        order.setStatus(OrderStatus.REFUNDED);

        // Create notification
        createNotification(order, NotificationType.REFUND,
                "Refund processed for " + refundDto.getProductReference());

        return salesOrderRepository.save(order);
    }

    @Transactional
    public SalesOrder cancelSalesOrder(Long orderId, CancelOrderDto cancelDto) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(cancelDto.getReason());

        // Create notification
        createNotification(order, NotificationType.CANCELLED,
                "Order cancelled: " + cancelDto.getReason());

        return salesOrderRepository.save(order);
    }

    public SalesOrder getOrderDetails(Long orderId) {
        return salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public LoanDetails generateRepaymentSchedule(Long orderId) {
        return loanDetailsRepository.findBySalesOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Loan details not found for order"));
    }

    // ==================== NOTIFICATIONS ====================

    private void createNotification(SalesOrder order, NotificationType type, String message) {
        SalesNotification notification = new SalesNotification();
        notification.setSalesOrderId(order.getId());
        notification.setCustomerName(order.getCustomerName());
        notification.setNotificationType(type);
        notification.setMessage(message);
        salesNotificationRepository.save(notification);
    }

    public List<SalesNotification> getOrderlistNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.ORDERLIST);
    }

    public List<SalesNotification> getCancelledNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.CANCELLED);
    }

    public List<SalesNotification> getRefundNotifications() {
        return salesNotificationRepository.findByNotificationTypeAndIsActionedFalse(NotificationType.REFUND);
    }

    // ==================== REPORTS ====================

    public Page<SalesOrder> getSalesReport(LocalDateTime startDate, LocalDateTime endDate,
            String orderMethod, String displayOption, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        }
        return salesOrderRepository.findAll(pageable);
    }

    public Page<SalesOrder> getOrdersReport(LocalDateTime startDate, LocalDateTime endDate,
            String orderMethod, String displayOption, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (orderMethod != null && !orderMethod.isEmpty()) {
            SalesOrderType type = SalesOrderType.valueOf(orderMethod);
            if (startDate != null && endDate != null) {
                return salesOrderRepository.findByOrderTypeAndCreatedAtBetween(type, startDate, endDate, pageable);
            }
            return salesOrderRepository.findByOrderType(type, pageable);
        }

        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        }
        return salesOrderRepository.findAll(pageable);
    }

    public Page<SalesOrder> getOrdersActionReport(String action, LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        OrderStatus status = switch (action.toUpperCase()) {
            case "REFUND_ORDER" -> OrderStatus.REFUNDED;
            case "CANCELLED_ORDER" -> OrderStatus.CANCELLED;
            case "PROGRESS" -> OrderStatus.PROCESSING;
            default -> OrderStatus.PENDING;
        };

        return salesOrderRepository.findByStatus(status, pageable);
    }

    public Page<SalesOrder> getOnlineInstallmentReport(LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findOnlineInstallmentOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getOnlineOneOffReport(LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findOnlineOneOffOrders(startDate, endDate, pageable);
    }

    public Page<SalesOrder> getAllOnlineSales(LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCustomerTypeAndCreatedAtBetween(
                    CustomerType.ONLINE, startDate, endDate, pageable);
        }
        return salesOrderRepository.findByCustomerType(CustomerType.ONLINE, pageable);
    }

    public Page<SalesOrder> getAllWalkInSales(LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (startDate != null && endDate != null) {
            return salesOrderRepository.findByCustomerTypeAndCreatedAtBetween(
                    CustomerType.WALKIN, startDate, endDate, pageable);
        }
        return salesOrderRepository.findByCustomerType(CustomerType.WALKIN, pageable);
    }

    public Page<SalesOrder> getWalkInCreditReport(LocalDateTime startDate,
            LocalDateTime endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return salesOrderRepository.findWalkInCreditOrders(startDate, endDate, pageable);
    }
}

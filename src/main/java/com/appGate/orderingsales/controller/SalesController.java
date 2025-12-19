package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.*;
import com.appGate.orderingsales.models.LoanDetails;
import com.appGate.orderingsales.models.SalesNotification;
import com.appGate.orderingsales.models.SalesOrder;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    // ==================== ORDER CREATION ====================

    @PostMapping("/orders/one-off")
    public BaseResponse createOneOffOrder(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOneOffOrder(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/orders/installment")
    public BaseResponse createInstallmentOrder(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createInstallmentOrder(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/online/one-off")
    public BaseResponse createOnlineOneOffSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOnlineOneOffSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/online/credit")
    public BaseResponse createOnlineCreditSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createOnlineCreditSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/walk-in/cash")
    public BaseResponse createWalkInCashSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createWalkInCashSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/walk-in/credit")
    public BaseResponse createWalkInCreditSales(@RequestBody SalesOrderDto dto) {
        SalesOrder order = salesService.createWalkInCreditSales(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", order);
    }

    @PostMapping("/orders/{orderId}/repayment-schedule")
    public BaseResponse generateRepaymentSchedule(@PathVariable Long orderId) {
        LoanDetails loanDetails = salesService.generateRepaymentSchedule(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", loanDetails);
    }

    // ==================== ORDER MANAGEMENT ====================

    @PutMapping("/orders/{orderId}/mark-paid")
    public BaseResponse markOrderAsPaid(@PathVariable Long orderId) {
        SalesOrder order = salesService.markAsPaid(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @PostMapping("/orders/{orderId}/refund")
    public BaseResponse processRefund(@PathVariable Long orderId, @RequestBody RefundDto refundDto) {
        SalesOrder order = salesService.processRefund(orderId, refundDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @PutMapping("/orders/{orderId}/cancel")
    public BaseResponse cancelOrder(@PathVariable Long orderId, @RequestBody CancelOrderDto cancelDto) {
        SalesOrder order = salesService.cancelSalesOrder(orderId, cancelDto);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    @GetMapping("/orders/{orderId}/details")
    public BaseResponse getOrderDetails(@PathVariable Long orderId) {
        SalesOrder order = salesService.getOrderDetails(orderId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", order);
    }

    // ==================== NOTIFICATIONS ====================

    @GetMapping("/notifications/orderlist")
    public BaseResponse getOrderlistNotifications() {
        List<SalesNotification> notifications = salesService.getOrderlistNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    @GetMapping("/notifications/cancelled")
    public BaseResponse getCancelledNotifications() {
        List<SalesNotification> notifications = salesService.getCancelledNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    @GetMapping("/notifications/refund")
    public BaseResponse getRefundNotifications() {
        List<SalesNotification> notifications = salesService.getRefundNotifications();
        return new BaseResponse(HttpStatus.OK.value(), "successful", notifications);
    }

    // ==================== REPORTS ====================

    @GetMapping("/reports")
    public BaseResponse getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String orderMethod,
            @RequestParam(required = false) String displayOption,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getSalesReport(startDate, endDate, orderMethod, displayOption, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/orders")
    public BaseResponse getOrdersReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String orderMethod,
            @RequestParam(required = false) String displayOption,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOrdersReport(startDate, endDate, orderMethod, displayOption, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/orders/actions")
    public BaseResponse getOrdersActionReport(
            @RequestParam String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOrdersActionReport(action, startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/online/installment")
    public BaseResponse getOnlineInstallmentReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOnlineInstallmentReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/online/one-off")
    public BaseResponse getOnlineOneOffReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getOnlineOneOffReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/all/online")
    public BaseResponse getAllOnlineSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getAllOnlineSales(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/all/walk-in")
    public BaseResponse getAllWalkInSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getAllWalkInSales(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }

    @GetMapping("/reports/walk-in/credit")
    public BaseResponse getWalkInCreditReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SalesOrder> orders = salesService.getWalkInCreditReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", orders);
    }
}

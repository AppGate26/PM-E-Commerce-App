package com.appGate.cashierstand.controller;

import com.appGate.cashierstand.dto.*;
import com.appGate.cashierstand.models.CashPayment;
import com.appGate.cashierstand.models.LoanPayment;
import com.appGate.cashierstand.service.CashierStandService;
import com.appGate.orderingsales.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/cashier")
@RequiredArgsConstructor
public class CashierStandController {

    private final CashierStandService cashierStandService;

    // ==================== CASH PAYMENT ====================

    @PostMapping("/cash-payment")
    public BaseResponse processCashPayment(@RequestBody CashPaymentDto dto) {
        CashPayment payment = cashierStandService.processCashPayment(dto);
        return new BaseResponse(HttpStatus.CREATED.value(), "successful", payment);
    }

    @PostMapping("/cash-payment/{paymentId}/generate-invoice")
    public BaseResponse generatePaymentInvoice(@PathVariable Long paymentId) {
        CashPayment payment = cashierStandService.getCashPayment(paymentId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", payment);
    }

    // ==================== TILL BALANCES ====================

    @GetMapping("/till-balances")
    public BaseResponse getTillBalances(@RequestParam String cashier) {
        Map<String, Object> balances = cashierStandService.getTillBalances(cashier);
        return new BaseResponse(HttpStatus.OK.value(), "successful", balances);
    }

    // ==================== LOAN PAYMENT ====================

    @GetMapping("/customer/search")
    public BaseResponse searchCustomerByAccount(@RequestParam String accountNumber) {
        Map<String, Object> customer = cashierStandService.searchCustomerByAccount(accountNumber);
        return new BaseResponse(HttpStatus.OK.value(), "successful", customer);
    }

    @GetMapping("/customers/directory")
    public BaseResponse getCustomerDirectory() {
        java.util.List<Map<String, Object>> customers = cashierStandService.getCustomerDirectory();
        return new BaseResponse(HttpStatus.OK.value(), "successful", customers);
    }

    @PostMapping("/wallet/initialize-paystack-checkout")
    public BaseResponse initializePaystackCheckout(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = cashierStandService.initializePaystackCheckout(payload);
        return new BaseResponse(HttpStatus.OK.value(), "successful", result);
    }

    // POST /cashier/loan-payment is closed off. It recorded a repayment against a
    // hard-coded ₦150,000 "previous balance" and touched no LoanDetails,
    // LoanRepaymentEntry, InstallmentPlan or wallet - so it produced a receipt and a
    // ledger line for a repayment that never actually reduced anybody's loan. No screen
    // calls it. Repayments go through the real paths: the Paystack installment flow
    // (/api/sales/orders/{id}/installment-payment/*) or the wallet endpoints.

    @GetMapping("/customer/{customerId}/ledger")
    public BaseResponse getCustomerLedger(
            @PathVariable Long customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> ledger = cashierStandService.getCustomerLedger(customerId, startDate, endDate);
        return new BaseResponse(HttpStatus.OK.value(), "successful", ledger);
    }

    // ==================== BALANCE ENQUIRY ====================

    @GetMapping("/balance-enquiry")
    public BaseResponse getBalanceEnquiry(@RequestParam String accountName) {
        Map<String, Object> balance = cashierStandService.getBalanceEnquiry(accountName);
        return new BaseResponse(HttpStatus.OK.value(), "successful", balance);
    }

    // ==================== CALL OVER ====================

    @GetMapping("/call-over")
    public BaseResponse getCallOver(
            @RequestParam(required = false) String cashier,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> callOver = cashierStandService.getCallOver(cashier, startDate, endDate);
        return new BaseResponse(HttpStatus.OK.value(), "successful", callOver);
    }

    // ==================== REPORTS ====================

    @GetMapping("/reports/all-deposits")
    public BaseResponse getAllDepositsReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> report = cashierStandService.getAllDepositsReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", report);
    }

    @GetMapping("/reports/cash-deposits")
    public BaseResponse getCashDepositsReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> report = cashierStandService.getCashDepositsReport(startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", report);
    }

    @GetMapping("/reports/bank-deposits")
    public BaseResponse getBankDepositsReport(
            @RequestParam(required = false) String bank,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Map<String, Object> report = cashierStandService.getBankDepositsReport(bank, startDate, endDate, page, size);
        return new BaseResponse(HttpStatus.OK.value(), "successful", report);
    }
}

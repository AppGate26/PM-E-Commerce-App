package com.appGate.client.controller;

import com.appGate.client.dto.SuspendCustomerDto;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;

import com.appGate.client.dto.CustomerDto;
import com.appGate.client.dto.UnblockCustomerDto;
import com.appGate.client.response.BaseResponse;
import com.appGate.client.services.CustomerService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping(path = "/api")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping(value = "/admin/add-walk-in-customer", consumes = "multipart/form-data")
    public BaseResponse createWalkinCustomer(@ModelAttribute CustomerDto customerDto, HttpServletRequest request) {

        return customerService.createWalkinCustomer(customerDto, request);
    }

    @GetMapping(path = "/users/customer/{customerId}")
    public BaseResponse getCustomersDetails(@PathVariable Long customerId) {

        return customerService.getCustomersDetails(customerId);
    }

    @GetMapping(path = "/users/customer/image/**")
    public ResponseEntity<Resource> downloadImage(HttpServletRequest request) {
        String fullPath = request.getRequestURI().split("/users/customer/image/")[1];
        Resource resource = customerService.loadFileAsResource(fullPath);

        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(resource);
    }

    @PutMapping(value = "/admin/update-walk-in-customer/{customerId}", consumes = "multipart/form-data")
    public BaseResponse updateWalkinCustomer(@PathVariable Long customerId, @ModelAttribute CustomerDto customerDto, HttpServletRequest request) {
        return customerService.updateWalkinCustomer(customerId, customerDto, request);
    }

    @GetMapping(path = "/admin/customers")
    public BaseResponse getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @PutMapping(value = "/admin/suspend-customer/{customerId}")
    public BaseResponse suspendCustomer(@PathVariable Long customerId,
            @Valid @RequestBody SuspendCustomerDto suspendCustomerDto) {
        return customerService.suspendCustomer(customerId, suspendCustomerDto);
    }

    @PutMapping(value = "/admin/unblock-customer/{customerId}")
    public BaseResponse unBlockCustomer(@PathVariable Long customerId,
            @Valid @RequestBody UnblockCustomerDto unblockCustomerDto) {
        return customerService.unBlockCustomer(customerId, unblockCustomerDto);
    }

    @GetMapping(value = "/admin/get-all-suspended-customers")
    public BaseResponse getAllSuspendedCustomers(){
        return customerService.getAllSuspendedCustomers(true);
    }

    @GetMapping(value = "/admin/get-all-active-customers")
    public BaseResponse getAllActiveCustomers(){
        return customerService.getAllSuspendedCustomers(false);
    }

    @GetMapping(value = "/admin/customers/online/report")
    public BaseResponse getOnlineCustomerReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customerService.getCustomerReportByType("ONLINE", startDate, endDate, sortBy, page, size);
    }

    @GetMapping(value = "/admin/customers/walk-in/report")
    public BaseResponse getWalkInCustomerReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customerService.getCustomerReportByType("WALKIN", startDate, endDate, sortBy, page, size);
    }

    @GetMapping(value = "/admin/customers/online/suspended/report")
    public BaseResponse getSuspendedOnlineCustomerReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customerService.getSuspendedCustomerReportByType("ONLINE", startDate, endDate, sortBy, page, size);
    }

    @GetMapping(value = "/admin/customers/walk-in/suspended/report")
    public BaseResponse getSuspendedWalkInCustomerReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customerService.getSuspendedCustomerReportByType("WALKIN", startDate, endDate, sortBy, page, size);
    }

    @GetMapping(value = "/admin/customers/search")
    public BaseResponse searchCustomers(
            @RequestParam String query,
            @RequestParam(required = false) String customerType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return customerService.searchCustomers(query, customerType, status, page, size);
    }

}

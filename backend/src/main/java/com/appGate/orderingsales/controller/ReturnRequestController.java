package com.appGate.orderingsales.controller;

import com.appGate.orderingsales.dto.CreateReturnRequestDto;
import com.appGate.orderingsales.dto.RestoreReturnRequestDto;
import com.appGate.orderingsales.dto.UpdateReturnStatusDto;
import com.appGate.orderingsales.enums.ReturnStatus;
import com.appGate.orderingsales.response.BaseResponse;
import com.appGate.orderingsales.service.ReturnRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
@Tag(name = "Returns", description = "Product return and replacement request endpoints")
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    // ==================== CUSTOMER ====================

    @PostMapping
    @Operation(summary = "Submit a return request for a delivered order")
    public BaseResponse createReturnRequest(@Valid @RequestBody CreateReturnRequestDto dto) {
        return returnRequestService.createReturnRequest(dto);
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get all return requests for a customer")
    public BaseResponse getByCustomer(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return returnRequestService.getByCustomer(customerId, page, size);
    }

    @GetMapping("/order/{salesOrderId}")
    @Operation(summary = "Get all return requests for a specific order")
    public BaseResponse getByOrder(
            @PathVariable Long salesOrderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return returnRequestService.getByOrder(salesOrderId, page, size);
    }

    // ==================== ADMIN ====================

    @GetMapping
    @Operation(summary = "Get all return requests (admin), optionally filtered by status")
    public BaseResponse getAll(
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (status != null) {
            return returnRequestService.getByStatus(status, page, size);
        }
        return returnRequestService.getAll(page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a return request by ID")
    public BaseResponse getById(@PathVariable Long id) {
        return returnRequestService.getById(id);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update return request status (admin)")
    public BaseResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReturnStatusDto dto) {
        return returnRequestService.updateStatus(id, dto);
    }

    @PutMapping("/{id}/restore")
    @Operation(summary = "Record restoration details for a completed return")
    public BaseResponse restoreReturn(
            @PathVariable Long id,
            @Valid @RequestBody RestoreReturnRequestDto dto) {
        return returnRequestService.restoreReturn(id, dto);
    }
}

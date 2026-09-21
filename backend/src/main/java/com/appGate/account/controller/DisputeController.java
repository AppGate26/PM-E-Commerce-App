package com.appGate.account.controller;

import com.appGate.account.dto.CreateDisputeDto;
import com.appGate.account.dto.DisputeFilterDto;
import com.appGate.account.dto.ResolveDisputeDto;
import com.appGate.account.enums.DisputeCategory;
import com.appGate.account.enums.DisputeResolution;
import com.appGate.account.enums.DisputeStatus;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.DisputeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
@Tag(name = "Payment - Disputes", description = "Dispute management endpoints")
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    @Operation(summary = "Create a new dispute")
    public ResponseEntity<BaseResponse> createDispute(@Valid @RequestBody CreateDisputeDto dto) {
        BaseResponse response = disputeService.createDispute(dto);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping
    @Operation(summary = "Filter disputes by status, resolution, category, and date range")
    public ResponseEntity<BaseResponse> filterDisputes(
            @RequestParam(required = false) DisputeStatus status,
            @RequestParam(required = false) DisputeResolution resolution,
            @RequestParam(required = false) DisputeCategory category,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        DisputeFilterDto filter = new DisputeFilterDto();
        filter.setStatus(status);
        filter.setResolution(resolution);
        filter.setCategory(category);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);

        BaseResponse response = disputeService.filterDisputes(filter, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get dispute by ID")
    public ResponseEntity<BaseResponse> getDisputeById(@PathVariable Long id) {
        BaseResponse response = disputeService.getDisputeById(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Resolve a dispute (admin)")
    public ResponseEntity<BaseResponse> resolveDispute(
            @PathVariable Long id,
            @Valid @RequestBody ResolveDisputeDto dto) {
        BaseResponse response = disputeService.resolveDispute(id, dto);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all disputes for a user")
    public ResponseEntity<BaseResponse> getUserDisputes(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        BaseResponse response = disputeService.getUserDisputes(userId, page, size);
        return ResponseEntity.ok(response);
    }
}

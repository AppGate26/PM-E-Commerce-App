package com.appGate.staffpayroll.controller;

import com.appGate.staffpayroll.dto.StaffAdvanceRepaymentDto;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.staffpayroll.service.StaffAdvanceRepaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/staff")
@Tag(name = "Staff Payroll - Advance Repayment", description = "Salary advance repayment tracking and scheduling")
public class StaffAdvanceRepaymentController {

    private final StaffAdvanceRepaymentService repaymentService;

    @Operation(summary = "Record a staff advance repayment")
    @PostMapping("/advance-repayment")
    public BaseResponse recordRepayment(@RequestBody StaffAdvanceRepaymentDto dto) {
        return repaymentService.recordRepayment(dto);
    }

    @Operation(summary = "Generate automatic repayment schedule for an advance")
    @PostMapping("/advance/{advanceId}/generate-schedule")
    public BaseResponse generateRepaymentSchedule(@PathVariable Long advanceId) {
        return repaymentService.generateRepaymentSchedule(advanceId);
    }

    @Operation(summary = "Get repayment schedule for a specific advance")
    @GetMapping("/advance/{advanceId}/repayment-schedule")
    public BaseResponse getRepaymentSchedule(@PathVariable Long advanceId) {
        return repaymentService.getRepaymentSchedule(advanceId);
    }

    @Operation(summary = "Get all repayments for a specific staff member")
    @GetMapping("/{staffId}/repayments")
    public BaseResponse getStaffRepayments(@PathVariable Long staffId) {
        return repaymentService.getStaffRepayments(staffId);
    }

    @Operation(summary = "Update repayment status (PENDING, COMPLETED, OVERDUE)")
    @PatchMapping("/advance-repayment/{repaymentId}/status")
    public BaseResponse updateRepaymentStatus(
            @PathVariable Long repaymentId,
            @RequestParam String status,
            @RequestParam Long recordedBy) {
        return repaymentService.updateRepaymentStatus(repaymentId, status, recordedBy);
    }

    @Operation(summary = "Delete a repayment record")
    @DeleteMapping("/advance-repayment/{repaymentId}")
    public BaseResponse deleteRepayment(@PathVariable Long repaymentId) {
        return repaymentService.deleteRepayment(repaymentId);
    }
}

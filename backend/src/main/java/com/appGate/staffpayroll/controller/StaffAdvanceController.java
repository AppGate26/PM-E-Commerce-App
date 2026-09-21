package com.appGate.staffpayroll.controller;

import com.appGate.staffpayroll.dto.StaffAdvanceDto;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.staffpayroll.service.StaffAdvanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/staff")
@Tag(name = "Staff Payroll - Advance", description = "Staff salary advance management")
public class StaffAdvanceController {

    private final StaffAdvanceService staffAdvanceService;

    @Operation(summary = "Register staff advance")
    @PostMapping("/advance")
    public BaseResponse createAdvance(@RequestBody StaffAdvanceDto dto) {
        return staffAdvanceService.createAdvance(dto);
    }

    @Operation(summary = "Get all staff advances")
    @GetMapping("/advance")
    public BaseResponse getAllAdvances() {
        return staffAdvanceService.getAllAdvances();
    }

    @Operation(summary = "Get advances for a specific staff member")
    @GetMapping("/{staffId}/advance")
    public BaseResponse getAdvancesByStaff(@PathVariable Long staffId) {
        return staffAdvanceService.getAdvancesByStaffId(staffId);
    }

    @Operation(summary = "Approve a staff advance")
    @PatchMapping("/advance/{id}/approve")
    public BaseResponse approveAdvance(
            @PathVariable Long id,
            @RequestParam Long approvedBy) {
        return staffAdvanceService.approveAdvance(id, approvedBy);
    }

    @Operation(summary = "Disburse an approved staff advance")
    @PatchMapping("/advance/{id}/disburse")
    public BaseResponse disburseAdvance(
            @PathVariable Long id,
            @RequestParam Long disbursedBy) {
        return staffAdvanceService.disburseAdvance(id, disbursedBy);
    }
}

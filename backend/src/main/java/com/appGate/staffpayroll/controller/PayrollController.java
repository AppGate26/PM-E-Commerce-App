package com.appGate.staffpayroll.controller;

import com.appGate.staffpayroll.dto.InitiatePayrollDto;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.staffpayroll.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@Tag(name = "Staff Payroll - Payroll Run", description = "Salary disbursement and approval")
public class PayrollController {

    private final PayrollService payrollService;

    @Operation(summary = "Initiate payroll", description = "Generate payroll entries for all active staff for a given period")
    @PostMapping("/api/admin/payroll/initiate")
    public BaseResponse initiatePayroll(@RequestBody InitiatePayrollDto dto) {
        return payrollService.initiatePayroll(dto);
    }

    @Operation(summary = "Get all payroll runs")
    @GetMapping("/api/admin/payroll/runs")
    public BaseResponse getAllPayrollRuns() {
        return payrollService.getAllPayrollRuns();
    }

    @Operation(summary = "Get payroll run by ID")
    @GetMapping("/api/admin/payroll/runs/{id}")
    public BaseResponse getPayrollRunById(@PathVariable Long id) {
        return payrollService.getPayrollRunById(id);
    }

    @Operation(summary = "Get payroll entries for a run")
    @GetMapping("/api/admin/payroll/runs/{id}/entries")
    public BaseResponse getPayrollEntries(@PathVariable Long id) {
        return payrollService.getPayrollEntries(id);
    }

    @Operation(summary = "Get pending payrolls awaiting approval")
    @GetMapping("/api/admin/payroll/pending")
    public BaseResponse getPendingPayrolls() {
        return payrollService.getPendingPayrolls();
    }

    @Operation(summary = "Approve payroll - SUPER_ADMIN", description = "SUPER_ADMIN approves a pending payroll run")
    @PatchMapping("/api/admin/payroll/runs/{id}/approve")
    public BaseResponse approvePayroll(@PathVariable Long id, @RequestParam Long approvedBy) {
        return payrollService.approvePayroll(id, approvedBy);
    }

    @Operation(summary = "Disburse approved payroll")
    @PatchMapping("/api/admin/payroll/runs/{id}/disburse")
    public BaseResponse disbursePayroll(@PathVariable Long id) {
        return payrollService.disbursePayroll(id);
    }

    @Operation(summary = "Get staff pay slips")
    @GetMapping("/api/admin/payroll/staff/{staffId}/payslips")
    public BaseResponse getStaffPaySlips(@PathVariable Long staffId) {
        return payrollService.getStaffPaySlips(staffId);
    }
}

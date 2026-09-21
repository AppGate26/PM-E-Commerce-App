package com.appGate.staffpayroll.controller;

import com.appGate.staffpayroll.dto.PayrollAccountDto;
import com.appGate.staffpayroll.dto.SalaryBreakdownDto;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.staffpayroll.service.SalaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@Tag(name = "Staff Payroll - Salary", description = "Salary structure and payroll account configuration")
public class SalaryController {

    private final SalaryService salaryService;

    @Operation(summary = "Setup payroll account", description = "Link a GL account to a salary component type (basic salary, allowance, deduction, tax)")
    @PostMapping("/api/admin/payroll/accounts")
    public BaseResponse setupPayrollAccount(@RequestBody PayrollAccountDto dto) {
        return salaryService.setupPayrollAccount(dto);
    }

    @Operation(summary = "Get payroll accounts")
    @GetMapping("/api/admin/payroll/accounts")
    public BaseResponse getPayrollAccounts() {
        return salaryService.getPayrollAccounts();
    }

    @Operation(summary = "Save salary breakdown", description = "Set basic salary and all component allowances/deductions/taxes for a staff member. Gross and net are auto-calculated.")
    @PostMapping("/api/admin/payroll/salary-breakdown")
    public BaseResponse saveSalaryBreakdown(@RequestBody SalaryBreakdownDto dto) {
        return salaryService.saveSalaryBreakdown(dto);
    }

    @Operation(summary = "Get salary breakdown by staff ID")
    @GetMapping("/api/admin/payroll/salary-breakdown/{staffId}")
    public BaseResponse getSalaryBreakdown(@PathVariable Long staffId) {
        return salaryService.getSalaryBreakdown(staffId);
    }
}

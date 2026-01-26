package com.appGate.account.controller;

import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.AccountingReportService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@Tag(name = "Account Management - Reports", description = "Accounting reports: Journal, Trial Balance, Profit & Loss")
public class AccountingReportController {

    private final AccountingReportService reportService;

    @Operation(summary = "Get journal report", description = "Generate journal report for a date range with optional reference filter")
    @GetMapping("/journal")
    public BaseResponse getJournalReport(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) String referenceNo) {
        return reportService.getJournalReport(startDate, endDate, referenceNo);
    }

    @Operation(summary = "Get trial balance", description = "Generate trial balance report (Simple, Detailed, or Concise)")
    @GetMapping("/trial-balance")
    public BaseResponse getTrialBalance(
            @RequestParam LocalDate asOfDate,
            @RequestParam(defaultValue = "Simple") String reportType) {
        return reportService.getTrialBalance(asOfDate, reportType);
    }

    @Operation(summary = "Get profit and loss", description = "Generate P&L statement with income and expenses breakdown")
    @GetMapping("/profit-and-loss")
    public BaseResponse getProfitAndLoss(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "Detailed") String reportType) {
        return reportService.getProfitAndLoss(startDate, endDate, reportType);
    }
}

package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.RecoveryReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class RecoveryReportController {

    private final RecoveryReportService recoveryReportService;

    public RecoveryReportController(RecoveryReportService recoveryReportService) {
        this.recoveryReportService = recoveryReportService;
    }

    @GetMapping("/recovery")
    public BaseResponse getRecoveryReport() {
        return recoveryReportService.getRecoveryReport();
    }

    @GetMapping("/recovery/agent/{recoveryAgentId}")
    public BaseResponse getRecoveryReportByAgent(@PathVariable Long recoveryAgentId) {
        return recoveryReportService.getRecoveryReportByAgent(recoveryAgentId);
    }

    @GetMapping("/loan")
    public BaseResponse getLoanReport() {
        return recoveryReportService.getLoanReport();
    }

    @GetMapping("/loan/customer/{customerId}")
    public BaseResponse getLoanReportByCustomer(@PathVariable Long customerId) {
        return recoveryReportService.getLoanReportByCustomer(customerId);
    }
}

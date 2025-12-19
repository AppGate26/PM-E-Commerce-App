package com.appGate.goodsrecovery.controller;

import com.appGate.goodsrecovery.dto.MarkAsRecoveredDto;
import com.appGate.goodsrecovery.response.BaseResponse;
import com.appGate.goodsrecovery.service.GoodsRecoveryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goods-recovery")
@Tag(name = "Goods Recovery", description = "Goods recovery from defaulting customers")
public class GoodsRecoveryController {

    private final GoodsRecoveryService goodsRecoveryService;

    public GoodsRecoveryController(GoodsRecoveryService goodsRecoveryService) {
        this.goodsRecoveryService = goodsRecoveryService;
    }

    @GetMapping("/pending")
    public BaseResponse getPendingRecoveries(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return goodsRecoveryService.getPendingRecoveries(status, page, size);
    }

    @GetMapping("/customer/{customerId}")
    public BaseResponse getCustomerRecoveryDetails(@PathVariable Long customerId) {
        return goodsRecoveryService.getCustomerRecoveryDetails(customerId);
    }

    @PostMapping(value = "/mark-recovered", consumes = "multipart/form-data")
    public BaseResponse markAsRecovered(
            @ModelAttribute @Valid MarkAsRecoveredDto dto,
            HttpServletRequest request) {
        return goodsRecoveryService.markAsRecovered(dto, request);
    }

    @GetMapping("/reports")
    public BaseResponse getRecoveryReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return goodsRecoveryService.getRecoveryReports(page, size);
    }

    @GetMapping("/reports/{recoveryId}")
    public BaseResponse getRecoveryReportDetail(@PathVariable Long recoveryId) {
        return goodsRecoveryService.getRecoveryReportDetail(recoveryId);
    }
}

package com.appGate.account.controller;

import com.appGate.account.dto.FundTransferDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.FundTransferService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/fund-transfers")
@RequiredArgsConstructor
@Tag(name = "Account Management - Fund Transfers", description = "Transfer funds between GL accounts")
public class FundTransferController {

    private final FundTransferService fundTransferService;

    @Operation(summary = "Create fund transfer", description = "Transfer funds between two GL accounts creating automatic journal entry")
    @PostMapping
    public BaseResponse createFundTransfer(
            @Valid @RequestBody FundTransferDto dto,
            @RequestParam Long userId) {
        return fundTransferService.createFundTransfer(dto, userId);
    }
}

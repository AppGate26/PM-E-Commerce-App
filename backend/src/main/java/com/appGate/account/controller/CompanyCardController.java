package com.appGate.account.controller;

import com.appGate.account.dto.CompanyCardDto;
import com.appGate.account.response.BaseResponse;
import com.appGate.account.service.CompanyCardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cashier/company-cards")
@RequiredArgsConstructor
@Tag(name = "Cashier - Company Cards", description = "Shared company card registry for wallet funding")
public class CompanyCardController {

    private final CompanyCardService companyCardService;

    @Operation(summary = "List active company cards")
    @GetMapping
    public BaseResponse listCompanyCards() {
        return companyCardService.listActiveCards();
    }

    @Operation(summary = "Add a company card")
    @PostMapping
    public BaseResponse addCompanyCard(@RequestBody CompanyCardDto dto) {
        return companyCardService.addCard(dto);
    }
}

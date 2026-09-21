package com.appGate.rbac.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.appGate.rbac.dto.BankDetailsDto;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.BankDetailsService;

@RestController
@RequestMapping(path = "/api/users/bank-details")
public class BankDetailsController {

    private final BankDetailsService bankDetailsService;

    public BankDetailsController(BankDetailsService bankDetailsService) {
        this.bankDetailsService = bankDetailsService;
    }

    @PostMapping(value = "/save-and-update")
    public BaseResponse saveAndUpdateBankDetails(@RequestBody BankDetailsDto bankDetailsDto) {
        return bankDetailsService.saveAndUpdateBankDetails(bankDetailsDto);
    }

    @GetMapping
    public BaseResponse getBankDetails(@RequestParam Long userId) {
        return bankDetailsService.getBankDetails(userId);
    }
}

package com.appGate.rbac.controller;

import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;


import com.appGate.rbac.service.VerificationService;
import com.appGate.rbac.dto.EmploymentInformationDto;
import com.appGate.rbac.dto.PersonalInformationDto;
import com.appGate.rbac.response.BaseResponse;

import jakarta.servlet.http.HttpServletRequest;


@RestController
@RequestMapping(path = "/api/users/verifications")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping(value = "/personal-information", consumes = "multipart/form-data")
    public BaseResponse savePersonalInformation(@ModelAttribute PersonalInformationDto personalInformationDto,
            HttpServletRequest request) {
        return verificationService.savePersonalInformation(personalInformationDto, request);
    }

    @PostMapping(value = "/employment-information")
    public BaseResponse saveEmploymentInformation(@RequestBody EmploymentInformationDto employmentInformationDto) {
        return verificationService.saveEmploymentInformation(employmentInformationDto);
    }

    
}

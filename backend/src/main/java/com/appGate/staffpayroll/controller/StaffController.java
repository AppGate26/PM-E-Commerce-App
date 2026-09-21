package com.appGate.staffpayroll.controller;

import com.appGate.staffpayroll.dto.*;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.staffpayroll.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@Tag(name = "Staff Payroll - Staff", description = "Staff registration and personal information management")
public class StaffController {

    private final StaffService staffService;

    @Operation(summary = "Register new staff", description = "Auto-generates staffId upon registration")
    @PostMapping("/api/admin/staff")
    public BaseResponse registerStaff(@RequestBody StaffRegistrationDto dto) {
        return staffService.registerStaff(dto);
    }

    @Operation(summary = "Get all staff")
    @GetMapping("/api/admin/staff")
    public BaseResponse getAllStaff() {
        return staffService.getAllStaff();
    }

    @Operation(summary = "Get staff by ID")
    @GetMapping("/api/admin/staff/{id}")
    public BaseResponse getStaffById(@PathVariable Long id) {
        return staffService.getStaffById(id);
    }

    @Operation(summary = "Get full staff profile", description = "Returns staff info, next of kin, employment, statutory, and bank details")
    @GetMapping("/api/admin/staff/{id}/profile")
    public BaseResponse getStaffProfile(@PathVariable Long id) {
        return staffService.getStaffProfile(id);
    }

    @Operation(summary = "Delete staff", description = "Remove a staff record and dependent info (e.g. when a staff is sacked)")
    @DeleteMapping("/api/admin/staff/{id}")
    public BaseResponse deleteStaff(@PathVariable Long id) {
        return staffService.deleteStaff(id);
    }

    @Operation(summary = "Save next of kin info")
    @PostMapping("/api/admin/staff/next-of-kin")
    public BaseResponse saveNextOfKin(@RequestBody NextOfKinDto dto) {
        return staffService.saveNextOfKin(dto);
    }

    @Operation(summary = "Save employment details")
    @PostMapping("/api/admin/staff/employment-details")
    public BaseResponse saveEmploymentDetails(@RequestBody EmploymentDetailsDto dto) {
        return staffService.saveEmploymentDetails(dto);
    }

    @Operation(summary = "Save statutory and tax info")
    @PostMapping("/api/admin/staff/statutory-info")
    public BaseResponse saveStatutoryInfo(@RequestBody StatutoryInfoDto dto) {
        return staffService.saveStatutoryInfo(dto);
    }

    @Operation(summary = "Save bank and payment details")
    @PostMapping("/api/admin/staff/bank-details")
    public BaseResponse saveBankDetails(@RequestBody StaffBankDetailsDto dto) {
        return staffService.saveBankDetails(dto);
    }
}

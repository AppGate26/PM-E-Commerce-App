package com.appGate.staffpayroll.service;

import com.appGate.staffpayroll.dto.*;
import com.appGate.staffpayroll.enums.StaffStatusEnum;
import com.appGate.staffpayroll.models.*;
import com.appGate.staffpayroll.repository.*;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@AllArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final NextOfKinRepository nextOfKinRepository;
    private final EmploymentDetailsRepository employmentDetailsRepository;
    private final StatutoryInfoRepository statutoryInfoRepository;
    private final StaffBankDetailsRepository staffBankDetailsRepository;
    private final BranchScopeService branchScopeService;

    private String generateStaffId() {
        long count = staffRepository.count() + 1;
        return String.format("STAFF-%04d", count);
    }

    /**
     * Load a staff member, refusing one who belongs to another branch.
     *
     * <p>Every write in this service already resolves the staff row first, so
     * routing those lookups through here is what keeps a branch manager from
     * editing another branch's staff by guessing an id.
     */
    private Staff loadStaffInScope(Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        branchScopeService.assertCanAccess(staff.getBranchId());
        return staff;
    }

    @Transactional
    public BaseResponse registerStaff(StaffRegistrationDto dto) {
        try {
            if (staffRepository.existsByEmail(dto.getEmail())) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "Staff with this email already exists", null);
            }
            Staff staff = new Staff();
            staff.setStaffId(generateStaffId());
            staff.setTitle(dto.getTitle());
            staff.setFullName(dto.getFullName());
            staff.setGender(dto.getGender());
            staff.setDateOfBirth(dto.getDateOfBirth());
            staff.setPhoneNumber(dto.getPhoneNumber());
            staff.setEmail(dto.getEmail());
            staff.setHomeAddress(dto.getHomeAddress());
            staff.setStateOfOrigin(dto.getStateOfOrigin());
            staff.setUserId(dto.getUserId());
            staff.setStatus(StaffStatusEnum.ACTIVE);
            // A branch user always registers into their own branch, whatever the DTO says.
            staff.setBranchId(branchScopeService.resolveWriteBranchId(dto.getBranchId()));
            return new BaseResponse(HttpStatus.CREATED.value(), "Staff registered successfully", staffRepository.save(staff));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getAllStaff() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "Staff list retrieved",
                branchId == null
                        ? staffRepository.findAll()
                        : staffRepository.findByBranchId(branchId));
    }

    public BaseResponse getStaffById(Long id) {
        Staff staff = staffRepository.findById(id).orElse(null);
        if (staff == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Staff not found", null);
        }
        branchScopeService.assertCanAccess(staff.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Staff found", staff);
    }

    public BaseResponse getStaffProfile(Long id) {
        try {
            Staff staff = loadStaffInScope(id);
            Map<String, Object> profile = new HashMap<>();
            profile.put("staff", staff);
            nextOfKinRepository.findByStaffId(id).ifPresent(k -> profile.put("nextOfKin", k));
            employmentDetailsRepository.findByStaffId(id).ifPresent(e -> profile.put("employmentDetails", e));
            statutoryInfoRepository.findByStaffId(id).ifPresent(s -> profile.put("statutoryInfo", s));
            staffBankDetailsRepository.findByStaffId(id).ifPresent(b -> profile.put("bankDetails", b));
            return new BaseResponse(HttpStatus.OK.value(), "Staff profile retrieved", profile);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteStaff(Long id) {
        try {
            Staff staff = loadStaffInScope(id);
            // Remove dependent records first so no orphans are left when a staff is offboarded.
            nextOfKinRepository.findByStaffId(id).ifPresent(nextOfKinRepository::delete);
            employmentDetailsRepository.findByStaffId(id).ifPresent(employmentDetailsRepository::delete);
            statutoryInfoRepository.findByStaffId(id).ifPresent(statutoryInfoRepository::delete);
            staffBankDetailsRepository.findByStaffId(id).ifPresent(staffBankDetailsRepository::delete);
            staffRepository.delete(staff);
            return new BaseResponse(HttpStatus.OK.value(), "Staff deleted successfully", null);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse saveNextOfKin(NextOfKinDto dto) {
        try {
            loadStaffInScope(dto.getStaffId());
            NextOfKin kin = nextOfKinRepository.findByStaffId(dto.getStaffId())
                    .orElse(new NextOfKin());
            kin.setStaffId(dto.getStaffId());
            kin.setFullName(dto.getFullName());
            kin.setPhoneNumber(dto.getPhoneNumber());
            kin.setRelationship(dto.getRelationship());
            return new BaseResponse(HttpStatus.OK.value(), "Next of kin saved", nextOfKinRepository.save(kin));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse saveEmploymentDetails(EmploymentDetailsDto dto) {
        try {
            loadStaffInScope(dto.getStaffId());
            EmploymentDetails details = employmentDetailsRepository.findByStaffId(dto.getStaffId())
                    .orElse(new EmploymentDetails());
            details.setStaffId(dto.getStaffId());
            details.setDepartment(dto.getDepartment());
            details.setDesignation(dto.getDesignation());
            details.setStaffGroup(dto.getStaffGroup());
            details.setEmploymentType(dto.getEmploymentType());
            details.setEmploymentDate(dto.getEmploymentDate());
            details.setSalaryLevel(dto.getSalaryLevel());
            details.setStaffStatus(dto.getStaffStatus() != null ? dto.getStaffStatus() : StaffStatusEnum.ACTIVE);
            return new BaseResponse(HttpStatus.OK.value(), "Employment details saved", employmentDetailsRepository.save(details));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse saveStatutoryInfo(StatutoryInfoDto dto) {
        try {
            loadStaffInScope(dto.getStaffId());
            StatutoryInfo info = statutoryInfoRepository.findByStaffId(dto.getStaffId())
                    .orElse(new StatutoryInfo());
            info.setStaffId(dto.getStaffId());
            info.setTaxId(dto.getTaxId());
            info.setPensionNumber(dto.getPensionNumber());
            info.setNhfNumber(dto.getNhfNumber());
            return new BaseResponse(HttpStatus.OK.value(), "Statutory info saved", statutoryInfoRepository.save(info));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse saveBankDetails(StaffBankDetailsDto dto) {
        try {
            loadStaffInScope(dto.getStaffId());
            StaffBankDetails bankDetails = staffBankDetailsRepository.findByStaffId(dto.getStaffId())
                    .orElse(new StaffBankDetails());
            bankDetails.setStaffId(dto.getStaffId());
            bankDetails.setBankName(dto.getBankName());
            bankDetails.setAccountNumber(dto.getAccountNumber());
            bankDetails.setAccountName(dto.getAccountName());
            return new BaseResponse(HttpStatus.OK.value(), "Bank details saved", staffBankDetailsRepository.save(bankDetails));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }
}

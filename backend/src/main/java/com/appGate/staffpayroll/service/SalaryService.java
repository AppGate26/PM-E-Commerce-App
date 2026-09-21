package com.appGate.staffpayroll.service;

import com.appGate.staffpayroll.dto.PayrollAccountDto;
import com.appGate.staffpayroll.dto.SalaryBreakdownDto;
import com.appGate.staffpayroll.dto.SalaryComponentDto;
import com.appGate.staffpayroll.enums.SalaryComponentType;
import com.appGate.staffpayroll.models.PayrollAccount;
import com.appGate.staffpayroll.models.SalaryBreakdown;
import com.appGate.staffpayroll.models.SalaryComponent;
import com.appGate.staffpayroll.repository.PayrollAccountRepository;
import com.appGate.staffpayroll.repository.SalaryBreakdownRepository;
import com.appGate.staffpayroll.repository.SalaryComponentRepository;
import com.appGate.staffpayroll.repository.StaffRepository;
import com.appGate.staffpayroll.models.Staff;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Payroll accounts (the GL mapping for salary components) are company-wide
 * configuration and stay unscoped. Salary breakdowns belong to a staff member,
 * and so inherit that staff member's branch.
 */
@Service
@AllArgsConstructor
public class SalaryService {

    private final SalaryBreakdownRepository salaryBreakdownRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    private final PayrollAccountRepository payrollAccountRepository;
    private final StaffRepository staffRepository;
    private final BranchScopeService branchScopeService;

    /** Load a staff member, refusing one who belongs to another branch. */
    private Staff loadStaffInScope(Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        branchScopeService.assertCanAccess(staff.getBranchId());
        return staff;
    }

    @Transactional
    public BaseResponse setupPayrollAccount(PayrollAccountDto dto) {
        try {
            PayrollAccount account = payrollAccountRepository.findByComponentType(dto.getComponentType())
                    .orElse(new PayrollAccount());
            account.setComponentType(dto.getComponentType());
            account.setAccountGlCode(dto.getAccountGlCode());
            account.setAccountName(dto.getAccountName());
            account.setDescription(dto.getDescription());
            return new BaseResponse(HttpStatus.OK.value(), "Payroll account configured", payrollAccountRepository.save(account));
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getPayrollAccounts() {
        return new BaseResponse(HttpStatus.OK.value(), "Payroll accounts", payrollAccountRepository.findAll());
    }

    @Transactional
    public BaseResponse saveSalaryBreakdown(SalaryBreakdownDto dto) {
        try {
            Staff staff = loadStaffInScope(dto.getStaffId());

            SalaryBreakdown breakdown = salaryBreakdownRepository.findByStaffId(dto.getStaffId())
                    .orElse(new SalaryBreakdown());
            breakdown.setStaffId(dto.getStaffId());
            breakdown.setBranchId(staff.getBranchId());
            breakdown.setBasicSalary(dto.getBasicSalary());

            BigDecimal totalAllowances = BigDecimal.ZERO;
            BigDecimal totalDeductions = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;

            if (dto.getComponents() != null) {
                for (SalaryComponentDto comp : dto.getComponents()) {
                    BigDecimal amount = resolveAmount(comp, dto.getBasicSalary());
                    if (comp.getComponentType() == SalaryComponentType.ALLOWANCE) {
                        totalAllowances = totalAllowances.add(amount);
                    } else if (comp.getComponentType() == SalaryComponentType.DEDUCTION) {
                        totalDeductions = totalDeductions.add(amount);
                    } else if (comp.getComponentType() == SalaryComponentType.TAX) {
                        totalTax = totalTax.add(amount);
                    }
                }
            }

            BigDecimal grossSalary = dto.getBasicSalary().add(totalAllowances);
            BigDecimal netSalary = grossSalary.subtract(totalDeductions).subtract(totalTax);

            breakdown.setGrossSalary(grossSalary);
            breakdown.setNetSalary(netSalary);
            SalaryBreakdown saved = salaryBreakdownRepository.save(breakdown);

            if (dto.getComponents() != null) {
                salaryComponentRepository.deleteBySalaryBreakdownId(saved.getId());
                List<SalaryComponent> components = new ArrayList<>();
                for (SalaryComponentDto compDto : dto.getComponents()) {
                    SalaryComponent component = new SalaryComponent();
                    component.setSalaryBreakdownId(saved.getId());
                    component.setComponentType(compDto.getComponentType());
                    component.setName(compDto.getName());
                    component.setIsPercentage(compDto.getIsPercentage() != null && compDto.getIsPercentage());
                    component.setPercentageValue(compDto.getPercentageValue());
                    component.setAmount(resolveAmount(compDto, dto.getBasicSalary()));
                    component.setPayrollAccountId(compDto.getPayrollAccountId());
                    components.add(component);
                }
                salaryComponentRepository.saveAll(components);
            }

            return new BaseResponse(HttpStatus.OK.value(), "Salary breakdown saved", saved);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    private BigDecimal resolveAmount(SalaryComponentDto comp, BigDecimal basicSalary) {
        if (Boolean.TRUE.equals(comp.getIsPercentage()) && comp.getPercentageValue() != null) {
            return basicSalary.multiply(comp.getPercentageValue()).divide(BigDecimal.valueOf(100));
        }
        return comp.getAmount() != null ? comp.getAmount() : BigDecimal.ZERO;
    }

    public BaseResponse getSalaryBreakdown(Long staffId) {
        try {
            loadStaffInScope(staffId);
            SalaryBreakdown breakdown = salaryBreakdownRepository.findByStaffId(staffId)
                    .orElseThrow(() -> new RuntimeException("Salary breakdown not found for staff"));
            List<SalaryComponent> components = salaryComponentRepository.findBySalaryBreakdownId(breakdown.getId());
            return new BaseResponse(HttpStatus.OK.value(), "Salary breakdown retrieved",
                    java.util.Map.of("breakdown", breakdown, "components", components));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }
}

package com.appGate.staffpayroll.service;

import com.appGate.staffpayroll.dto.InitiatePayrollDto;
import com.appGate.staffpayroll.enums.PayrollStatus;
import com.appGate.staffpayroll.enums.StaffStatusEnum;
import com.appGate.staffpayroll.models.PayrollEntry;
import com.appGate.staffpayroll.models.PayrollRun;
import com.appGate.staffpayroll.models.SalaryBreakdown;
import com.appGate.staffpayroll.models.Staff;
import com.appGate.staffpayroll.repository.PayrollEntryRepository;
import com.appGate.staffpayroll.repository.PayrollRunRepository;
import com.appGate.staffpayroll.repository.SalaryBreakdownRepository;
import com.appGate.staffpayroll.repository.StaffRepository;
import com.appGate.staffpayroll.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Payroll is run per branch: a branch manager initiates a run covering only the
 * staff posted to their branch, and can only see and approve their own runs.
 */
@Service
@AllArgsConstructor
public class PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollEntryRepository payrollEntryRepository;
    private final StaffRepository staffRepository;
    private final SalaryBreakdownRepository salaryBreakdownRepository;
    private final BranchScopeService branchScopeService;

    /** Load a run, refusing one that belongs to another branch. */
    private PayrollRun loadRunInScope(Long payrollRunId) {
        PayrollRun run = payrollRunRepository.findById(payrollRunId)
                .orElseThrow(() -> new RuntimeException("Payroll run not found"));
        branchScopeService.assertCanAccess(run.getBranchId());
        return run;
    }

    @Transactional
    public BaseResponse initiatePayroll(InitiatePayrollDto dto) {
        try {
            Long branchId = branchScopeService.getScopedBranchId();

            // A period is only unique within a branch — two branches must both be
            // able to run the same month.
            boolean periodTaken = branchId == null
                    ? payrollRunRepository.findByPeriodAndBranchIdIsNull(dto.getPeriod()).isPresent()
                    : payrollRunRepository.findByPeriodAndBranchId(dto.getPeriod(), branchId).isPresent();
            if (periodTaken) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Payroll for period " + dto.getPeriod() + " already exists", null);
            }

            // Only this branch's staff go on this branch's payroll.
            List<Staff> activeStaff = branchId == null
                    ? staffRepository.findByStatus(StaffStatusEnum.ACTIVE)
                    : staffRepository.findByBranchIdAndStatus(branchId, StaffStatusEnum.ACTIVE);
            if (activeStaff.isEmpty()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "No active staff found", null);
            }

            PayrollRun run = new PayrollRun();
            run.setPeriod(dto.getPeriod());
            run.setPaymentDate(dto.getPaymentDate());
            run.setStatus(PayrollStatus.PENDING);
            run.setInitiatedBy(dto.getInitiatedBy());
            run.setBranchId(branchId);
            PayrollRun savedRun = payrollRunRepository.save(run);

            BigDecimal totalAmount = BigDecimal.ZERO;
            List<PayrollEntry> entries = new ArrayList<>();

            for (Staff staff : activeStaff) {
                SalaryBreakdown breakdown = salaryBreakdownRepository.findByStaffId(staff.getId()).orElse(null);
                if (breakdown == null) continue;

                PayrollEntry entry = new PayrollEntry();
                entry.setPayrollRunId(savedRun.getId());
                entry.setStaffId(staff.getId());
                entry.setStaffName(staff.getFullName());
                entry.setBranchId(savedRun.getBranchId());
                entry.setBasicSalary(breakdown.getBasicSalary());
                entry.setGrossSalary(breakdown.getGrossSalary());
                entry.setNetSalary(breakdown.getNetSalary());
                entry.setStatus(PayrollStatus.PENDING);
                entries.add(entry);
                totalAmount = totalAmount.add(breakdown.getNetSalary() != null ? breakdown.getNetSalary() : BigDecimal.ZERO);
            }

            payrollEntryRepository.saveAll(entries);
            savedRun.setTotalAmount(totalAmount);
            payrollRunRepository.save(savedRun);

            return new BaseResponse(HttpStatus.CREATED.value(), "Payroll initiated for " + entries.size() + " staff",
                    Map.of("payrollRun", savedRun, "entries", entries));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse approvePayroll(Long payrollRunId, Long approvedBy) {
        try {
            PayrollRun run = loadRunInScope(payrollRunId);
            if (run.getStatus() != PayrollStatus.PENDING) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Payroll is not in PENDING state", null);
            }
            run.setStatus(PayrollStatus.APPROVED);
            run.setApprovedBy(approvedBy);
            run.setApprovedAt(LocalDateTime.now());
            payrollRunRepository.save(run);

            List<PayrollEntry> entries = payrollEntryRepository.findByPayrollRunId(payrollRunId);
            entries.forEach(e -> e.setStatus(PayrollStatus.APPROVED));
            payrollEntryRepository.saveAll(entries);

            return new BaseResponse(HttpStatus.OK.value(), "Payroll approved", run);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse disbursePayroll(Long payrollRunId) {
        try {
            PayrollRun run = loadRunInScope(payrollRunId);
            if (run.getStatus() != PayrollStatus.APPROVED) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Payroll must be APPROVED before disbursement", null);
            }
            run.setStatus(PayrollStatus.DISBURSED);
            payrollRunRepository.save(run);

            List<PayrollEntry> entries = payrollEntryRepository.findByPayrollRunId(payrollRunId);
            entries.forEach(e -> e.setStatus(PayrollStatus.DISBURSED));
            payrollEntryRepository.saveAll(entries);

            return new BaseResponse(HttpStatus.OK.value(), "Payroll disbursed", run);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage(), null);
        }
    }

    public BaseResponse getAllPayrollRuns() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "Payroll runs",
                branchId == null
                        ? payrollRunRepository.findAll()
                        : payrollRunRepository.findByBranchId(branchId));
    }

    public BaseResponse getPayrollRunById(Long id) {
        PayrollRun run = payrollRunRepository.findById(id).orElse(null);
        if (run == null) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "Payroll run not found", null);
        }
        branchScopeService.assertCanAccess(run.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Payroll run found", run);
    }

    public BaseResponse getPayrollEntries(Long payrollRunId) {
        // Entries inherit the run's branch, so guarding the run guards the entries.
        loadRunInScope(payrollRunId);
        return new BaseResponse(HttpStatus.OK.value(), "Payroll entries",
                payrollEntryRepository.findByPayrollRunId(payrollRunId));
    }

    public BaseResponse getStaffPaySlips(Long staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        branchScopeService.assertCanAccess(staff.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Pay slips",
                payrollEntryRepository.findByStaffId(staffId));
    }

    public BaseResponse getPendingPayrolls() {
        Long branchId = branchScopeService.getScopedBranchId();
        return new BaseResponse(HttpStatus.OK.value(), "Pending payrolls",
                branchId == null
                        ? payrollRunRepository.findByStatus(PayrollStatus.PENDING)
                        : payrollRunRepository.findByBranchIdAndStatus(branchId, PayrollStatus.PENDING));
    }
}

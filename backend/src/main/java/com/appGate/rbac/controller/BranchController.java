package com.appGate.rbac.controller;

import com.appGate.rbac.dto.AssignManagerDto;
import com.appGate.rbac.dto.BranchDto;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.BranchService;
import com.appGate.rbac.service.BranchSummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;
    private final BranchSummaryService branchSummaryService;

    // Head-office consolidated per-branch report (stock, sales, account by branch).
    // Open to anyone who may see every branch — super admin, admin, OR a user posted
    // to Head Office (who need not be an admin), matching BranchContextFilter.
    @GetMapping("/summary")
    @PreAuthorize("@branchAccess.canViewAllBranches()")
    public BaseResponse getConsolidatedSummary() {
        return branchSummaryService.getConsolidatedSummary();
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BaseResponse createBranch(@Valid @RequestBody BranchDto dto) {
        return branchService.createBranch(dto);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public BaseResponse getAllBranches() {
        return branchService.getAllBranches();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse getBranchById(@PathVariable Long id) {
        return branchService.getBranchById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse updateBranch(@PathVariable Long id, @Valid @RequestBody BranchDto dto) {
        return branchService.updateBranch(id, dto);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BaseResponse activateBranch(@PathVariable Long id) {
        return branchService.activateBranch(id);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BaseResponse deactivateBranch(@PathVariable Long id) {
        return branchService.deactivateBranch(id);
    }

    // Moves the isHeadOffice flag to this branch, unflagging whichever branch held
    // it before. SUPER_ADMIN only -- this changes who gets unrestricted, all-branch
    // access (BranchContextFilter, BranchAccessEvaluator both read the flag).
    @PatchMapping("/{id}/set-head-office")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BaseResponse setHeadOffice(@PathVariable Long id) {
        return branchService.setHeadOffice(id);
    }

    @PostMapping("/{id}/assign-manager")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public BaseResponse assignManager(@PathVariable Long id, @Valid @RequestBody AssignManagerDto dto) {
        return branchService.assignManager(id, dto);
    }

    @PostMapping("/{id}/assign-user/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse assignUserToBranch(@PathVariable Long id, @PathVariable Long userId) {
        return branchService.assignUserToBranch(id, userId);
    }

    @GetMapping("/{id}/staff")
    @PreAuthorize("isAuthenticated()")
    public BaseResponse getBranchStaff(@PathVariable Long id) {
        return branchService.getBranchStaff(id);
    }
}

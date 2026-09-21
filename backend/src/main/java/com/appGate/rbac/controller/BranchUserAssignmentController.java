package com.appGate.rbac.controller;

import com.appGate.rbac.dto.BranchUserAssignmentDto;
import com.appGate.rbac.response.BaseResponse;
import com.appGate.rbac.service.BranchUserAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/branch-assignments")
@RequiredArgsConstructor
public class BranchUserAssignmentController {

    private final BranchUserAssignmentService branchUserAssignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse list() {
        return branchUserAssignmentService.list();
    }

    @GetMapping("/user")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse getByEmail(@RequestParam String email) {
        return branchUserAssignmentService.getByEmail(email);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse upsert(@Valid @RequestBody BranchUserAssignmentDto dto) {
        return branchUserAssignmentService.upsert(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public BaseResponse delete(@PathVariable Long id) {
        return branchUserAssignmentService.delete(id);
    }
}

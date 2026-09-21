package com.appGate.rbac.service;

import com.appGate.rbac.dto.BranchUserAssignmentDto;
import com.appGate.rbac.enums.ApprovalScopeEnum;
import com.appGate.rbac.enums.LocationTypeEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.BranchUserAssignment;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.repository.BranchUserAssignmentRepository;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchUserAssignmentService {

    private final BranchUserAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public BaseResponse upsert(BranchUserAssignmentDto dto) {
        Optional<User> userOptional = userRepository.findByEmail(dto.getEmail().toLowerCase());
        if (userOptional.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "User not found");
        }
        User user = userOptional.get();

        try {
            BranchUserAssignment assignment = assignmentRepository.findByUserId(user.getId())
                    .orElseGet(BranchUserAssignment::new);
            assignment.setUser(user);

            if (dto.getBranchId() != null) {
                Branch branch = branchRepository.findById(dto.getBranchId()).orElse(null);
                if (branch == null) {
                    return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "Branch not found");
                }
                assignment.setBranch(branch);
            } else {
                assignment.setBranch(null);
            }

            assignment.setWarehouseId(dto.getWarehouseId());
            assignment.setWarehouseName(dto.getWarehouseName());
            assignment.setJobRole(dto.getJobRole());
            assignment.setLocationType(resolveLocationType(dto.getLocationType(), assignment.getBranch()));
            assignment.setApprovalScope(resolveApprovalScope(dto.getApprovalScope(), assignment.getLocationType()));

            BranchUserAssignment saved = assignmentRepository.save(assignment);
            return new BaseResponse(HttpStatus.OK.value(), "successful", toResult(saved));
        } catch (DataIntegrityViolationException e) {
            BranchUserAssignment assignment = assignmentRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Failed to resolve assignment after concurrent insert"));
            assignment.setUser(user);

            if (dto.getBranchId() != null) {
                Branch branch = branchRepository.findById(dto.getBranchId()).orElse(null);
                if (branch == null) {
                    return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "Branch not found");
                }
                assignment.setBranch(branch);
            } else {
                assignment.setBranch(null);
            }

            assignment.setWarehouseId(dto.getWarehouseId());
            assignment.setWarehouseName(dto.getWarehouseName());
            assignment.setJobRole(dto.getJobRole());
            assignment.setLocationType(resolveLocationType(dto.getLocationType(), assignment.getBranch()));
            assignment.setApprovalScope(resolveApprovalScope(dto.getApprovalScope(), assignment.getLocationType()));

            BranchUserAssignment saved = assignmentRepository.save(assignment);
            return new BaseResponse(HttpStatus.OK.value(), "successful", toResult(saved));
        }
    }

    public BaseResponse list() {
        List<Map<String, Object>> rows = assignmentRepository.findAll().stream()
                .map(this::toResult)
                .toList();
        return new BaseResponse(HttpStatus.OK.value(), "successful", rows);
    }

    public BaseResponse getByEmail(String email) {
        return assignmentRepository.findByUserEmail(email.toLowerCase())
                .map(assignment -> new BaseResponse(HttpStatus.OK.value(), "successful", toResult(assignment)))
                .orElseGet(() -> new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "Assignment not found"));
    }

    public BaseResponse delete(Long id) {
        if (!assignmentRepository.existsById(id)) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "Assignment not found");
        }
        assignmentRepository.deleteById(id);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Assignment removed");
    }

    private LocationTypeEnum resolveLocationType(String value, Branch branch) {
        if (value != null && !value.isBlank()) {
            try {
                return LocationTypeEnum.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Fall through to derivation below.
            }
        }
        return branch != null && branch.isHeadOffice() ? LocationTypeEnum.HEAD_OFFICE : LocationTypeEnum.BRANCH;
    }

    private ApprovalScopeEnum resolveApprovalScope(String value, LocationTypeEnum locationType) {
        if (value != null && !value.isBlank()) {
            try {
                return ApprovalScopeEnum.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Fall through to derivation below.
            }
        }
        return locationType == LocationTypeEnum.HEAD_OFFICE
                ? ApprovalScopeEnum.HEAD_OFFICE_AND_BRANCHES
                : ApprovalScopeEnum.BRANCH_ONLY;
    }

    private Map<String, Object> toResult(BranchUserAssignment assignment) {
        Map<String, Object> result = new LinkedHashMap<>();
        User user = assignment.getUser();
        Branch branch = assignment.getBranch();
        result.put("id", assignment.getId());
        result.put("userEmail", user != null ? user.getEmail() : null);
        result.put("userName", user != null ? buildName(user) : null);
        result.put("branchId", branch != null ? branch.getId() : null);
        result.put("branchName", branch != null ? branch.getBranchName() : "Head Office");
        result.put("warehouseId", assignment.getWarehouseId());
        result.put("warehouseName", assignment.getWarehouseName());
        // Expose under both keys so existing UI lookups (userRole || jobRole) keep working.
        result.put("jobRole", assignment.getJobRole());
        result.put("userRole", assignment.getJobRole());
        result.put("locationType", assignment.getLocationType());
        result.put("approvalScope", assignment.getApprovalScope());
        result.put("updatedAt", assignment.getUpdatedAt());
        return result;
    }

    private String buildName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getEmail() : full;
    }
}

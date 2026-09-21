package com.appGate.rbac.service;

import com.appGate.rbac.dto.AssignManagerDto;
import com.appGate.rbac.dto.BranchDto;
import com.appGate.rbac.enums.BranchStatusEnum;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.State;
import com.appGate.rbac.models.User;
import com.appGate.rbac.models.Ward;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.StateRepository;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.repository.WardRepository;
import com.appGate.rbac.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final WardRepository wardRepository;

    @Transactional
    public BaseResponse createBranch(BranchDto dto) {
        try {
            Branch branch = new Branch();
            branch.setBranchName(dto.getBranchName());
            branch.setAddress(dto.getAddress());
            branch.setPhone(dto.getPhone());
            branch.setEmail(dto.getEmail());
            branch.setStatus(BranchStatusEnum.ACTIVE);

            if (dto.getStateId() != null) {
                State state = stateRepository.findById(dto.getStateId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "State not found"));
                branch.setState(state);
            }
            if (dto.getLgaId() != null) {
                LGA lga = lgaRepository.findById(dto.getLgaId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LGA not found"));
                branch.setLga(lga);
            }
            if (dto.getWardId() != null) {
                Ward ward = wardRepository.findById(dto.getWardId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ward not found"));
                branch.setWard(ward);
            }
            if (dto.getManagerId() != null) {
                User manager = userRepository.findById(dto.getManagerId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Manager user not found"));
                if (manager.getRole() != RoleEnum.BRANCH_MANAGER) {
                    return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                            "Assigned manager must have BRANCH_MANAGER role");
                }
                branch.setManagerId(dto.getManagerId());
            }

            // First save to get the auto-generated id
            Branch savedBranch = branchRepository.save(branch);

            // Generate branch code: "BR/YY/NNNN"
            String year = String.valueOf(Year.now().getValue()).substring(2);
            String formattedId = String.format("%04d", savedBranch.getId());
            savedBranch.setBranchCode("BR/" + year + "/" + formattedId);
            savedBranch = branchRepository.save(savedBranch);

            return new BaseResponse(HttpStatus.CREATED.value(), "successful", savedBranch);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "failure", "Error creating branch: " + e.getMessage());
        }
    }

    public BaseResponse getAllBranches() {
        List<Branch> branches = branchRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "successful", branches);
    }

    public BaseResponse getBranchById(Long id) {
        Optional<Branch> branch = branchRepository.findById(id);
        if (branch.isEmpty()) {
            return new BaseResponse(HttpStatus.NOT_FOUND.value(), "failure", "Branch not found");
        }
        return new BaseResponse(HttpStatus.OK.value(), "successful", branch.get());
    }

    @Transactional
    public BaseResponse updateBranch(Long id, BranchDto dto) {
        try {
            Branch branch = branchRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));

            if (dto.getBranchName() != null) branch.setBranchName(dto.getBranchName());
            if (dto.getAddress() != null) branch.setAddress(dto.getAddress());
            if (dto.getPhone() != null) branch.setPhone(dto.getPhone());
            if (dto.getEmail() != null) branch.setEmail(dto.getEmail());

            if (dto.getStateId() != null) {
                State state = stateRepository.findById(dto.getStateId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "State not found"));
                branch.setState(state);
            }
            if (dto.getLgaId() != null) {
                LGA lga = lgaRepository.findById(dto.getLgaId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LGA not found"));
                branch.setLga(lga);
            }
            if (dto.getWardId() != null) {
                Ward ward = wardRepository.findById(dto.getWardId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ward not found"));
                branch.setWard(ward);
            }

            Branch updatedBranch = branchRepository.save(branch);
            return new BaseResponse(HttpStatus.OK.value(), "successful", updatedBranch);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "failure", "Error updating branch: " + e.getMessage());
        }
    }

    @Transactional
    public BaseResponse activateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        branch.setStatus(BranchStatusEnum.ACTIVE);
        branchRepository.save(branch);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Branch activated successfully");
    }

    @Transactional
    public BaseResponse deactivateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        if (branch.isHeadOffice()) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                    "Head Office branch cannot be deactivated");
        }
        branch.setStatus(BranchStatusEnum.INACTIVE);
        branchRepository.save(branch);
        return new BaseResponse(HttpStatus.OK.value(), "successful", "Branch deactivated successfully");
    }

    /**
     * Moves the {@code isHeadOffice} flag to a different branch: unflags whichever
     * branch currently holds it (if any) and flags this one instead. Every caller
     * posted to the old Head Office branch loses unrestricted, all-branch access on
     * their next request; everyone posted to the new one gains it -- this is the
     * only place that access relationship changes.
     */
    @Transactional
    public BaseResponse setHeadOffice(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));

        if (branch.isHeadOffice()) {
            return new BaseResponse(HttpStatus.OK.value(), "successful", "Branch is already Head Office");
        }
        if (branch.getStatus() != BranchStatusEnum.ACTIVE) {
            return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                    "Activate the branch before making it Head Office");
        }

        branchRepository.findByHeadOfficeTrue().ifPresent(previous -> {
            previous.setHeadOffice(false);
            branchRepository.save(previous);
        });

        branch.setHeadOffice(true);
        Branch saved = branchRepository.save(branch);
        return new BaseResponse(HttpStatus.OK.value(), "successful", saved);
    }

    @Transactional
    public BaseResponse assignManager(Long branchId, AssignManagerDto dto) {
        try {
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));

            User manager = userRepository.findById(dto.getManagerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            if (manager.getRole() != RoleEnum.BRANCH_MANAGER) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                        "User must have BRANCH_MANAGER role to be assigned as branch manager");
            }

            branch.setManagerId(dto.getManagerId());

            // Also assign the manager to this branch to keep both sides consistent
            if (manager.getBranch() == null || !manager.getBranch().getId().equals(branchId)) {
                manager.setBranch(branch);
                userRepository.save(manager);
            }

            branchRepository.save(branch);
            return new BaseResponse(HttpStatus.OK.value(), "successful", "Manager assigned successfully");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "failure", "Error assigning manager: " + e.getMessage());
        }
    }

    @Transactional
    public BaseResponse assignUserToBranch(Long branchId, Long userId) {
        try {
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            if (user.getRole() == RoleEnum.SUPER_ADMIN) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(), "failure",
                        "SUPER_ADMIN cannot be assigned to a branch");
            }

            user.setBranch(branch);
            userRepository.save(user);

            return new BaseResponse(HttpStatus.OK.value(), "successful", "User assigned to branch successfully");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "failure", "Error assigning user to branch: " + e.getMessage());
        }
    }

    public BaseResponse getBranchStaff(Long branchId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        List<User> staff = userRepository.findByBranchId(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "successful", staff);
    }
}

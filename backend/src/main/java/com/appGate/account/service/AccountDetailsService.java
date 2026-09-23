package com.appGate.account.service;

import com.appGate.account.dto.CreateAccountDetailsDto;
import com.appGate.account.dto.UpdateAccountDetailsDto;
import com.appGate.account.enums.GlPurpose;
import com.appGate.account.models.Account;
import com.appGate.account.models.AccountDetails;
import com.appGate.account.repository.AccountDetailsRepository;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.repository.BranchRepository;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Account Details are the posting-level GLs, and every one belongs to a branch.
 *
 * <p>Branch users only see and write their own branch's GLs. Admin / Head Office
 * users see every branch unless they narrow to one with the {@code X-Branch-Id}
 * header, and may create a GL for any branch; with no branch chosen it lands on
 * Head Office.
 *
 * <p>A GL can be tagged with a {@link GlPurpose} so {@link GlPostingService} can
 * find it when a Paystack or wallet payment succeeds. Each branch may tag at
 * most one GL per purpose, and {@link GlPurpose#CUSTOMER_WALLET} is Head Office only.
 */
@Service
@RequiredArgsConstructor
public class AccountDetailsService {

    private final AccountDetailsRepository accountDetailsRepository;
    private final AccountRepository accountRepository;
    private final BranchScopeService branchScopeService;
    private final BranchRepository branchRepository;

    @Transactional
    public BaseResponse create(CreateAccountDetailsDto dto) {
        try {
            if (accountDetailsRepository.findByAccountDetailsCode(dto.getAccountDetailsCode()).isPresent()) {
                throw new RuntimeException("Account Details Code already exists");
            }
            Long branchId = branchScopeService.resolveWriteBranchId(dto.getBranchId());
            if (branchId == null) {
                branchId = headOfficeBranchId();
            } else if (!branchRepository.existsById(branchId)) {
                throw new RuntimeException("Branch not found");
            }
            validatePurpose(branchId, dto.getGlPurpose(), null);

            AccountDetails accountDetails = new AccountDetails();
            accountDetails.setAccountTypeId(dto.getAccountTypeId());
            accountDetails.setControlAccountId(dto.getControlAccountId());
            accountDetails.setChartOfAccountId(dto.getChartOfAccountId());
            accountDetails.setAccountDetailsName(dto.getAccountDetailsName());
            accountDetails.setAccountDetailsCode(dto.getAccountDetailsCode());
            accountDetails.setBranchId(branchId);
            accountDetails.setGlPurpose(dto.getGlPurpose());
            AccountDetails saved = accountDetailsRepository.save(accountDetails);

            // Auto-mint a paired Account row for GL posting (keyed by glCode = accountDetailsCode)
            String glCode = dto.getAccountDetailsCode();
            if (!accountRepository.findByGlCode(glCode).isPresent()) {
                Account account = new Account();
                account.setGlCode(glCode);
                account.setAccountName(dto.getAccountDetailsName());
                account.setAccountTypeId(dto.getAccountTypeId());
                account.setIsControlAccount(false);
                account.setIsActive(true);
                account.setBalance(BigDecimal.ZERO);
                account.setBranchId(branchId);
                accountRepository.save(account);
            }

            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Account Details created successfully")
                    .data(saved)
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (RuntimeException e) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message(e.getMessage())
                    .data(null)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to create Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Long branchId = branchScopeService.getScopedBranchId();
            Page<AccountDetails> results = branchId == null
                    ? accountDetailsRepository.findAll(pageable)
                    : accountDetailsRepository.findByBranchId(branchId, pageable);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(results)
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getById(Long id) {
        try {
            AccountDetails accountDetails = accountDetailsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Details not found"));
            branchScopeService.assertCanAccess(accountDetails.getBranchId());
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(accountDetails)
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (RuntimeException e) {
            return BaseResponse.builder()
                    .status(HttpStatus.NOT_FOUND.value())
                    .message(e.getMessage())
                    .data(null)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getByChartOfAccountId(Long chartOfAccountId) {
        try {
            Long branchId = branchScopeService.getScopedBranchId();
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(branchId == null
                            ? accountDetailsRepository.findByChartOfAccountId(chartOfAccountId)
                            : accountDetailsRepository.findByBranchIdAndChartOfAccountId(branchId, chartOfAccountId))
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse update(Long id, UpdateAccountDetailsDto dto) {
        try {
            AccountDetails accountDetails = accountDetailsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Details not found"));
            branchScopeService.assertCanAccess(accountDetails.getBranchId());
            validatePurpose(accountDetails.getBranchId(), dto.getGlPurpose(), accountDetails.getId());
            accountDetails.setAccountDetailsName(dto.getAccountDetailsName());
            accountDetails.setGlPurpose(dto.getGlPurpose());
            AccountDetails updated = accountDetailsRepository.save(accountDetails);

            // Update the paired Account row's accountName to stay in sync
            accountRepository.findByGlCode(updated.getAccountDetailsCode())
                    .ifPresent(account -> {
                        account.setAccountName(dto.getAccountDetailsName());
                        accountRepository.save(account);
                    });

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details updated successfully")
                    .data(updated)
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (RuntimeException e) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message(e.getMessage())
                    .data(null)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to update Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse delete(Long id) {
        try {
            AccountDetails accountDetails = accountDetailsRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Details not found"));
            branchScopeService.assertCanAccess(accountDetails.getBranchId());
            accountDetailsRepository.delete(accountDetails);

            // Soft-deactivate the paired Account row instead of deleting (FK risk from existing journal_lines)
            accountRepository.findByGlCode(accountDetails.getAccountDetailsCode())
                    .ifPresent(account -> {
                        account.setIsActive(false);
                        accountRepository.save(account);
                    });

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details deleted successfully")
                    .data(null)
                    .build();
        } catch (AccessDeniedException e) {
            return forbidden(e);
        } catch (RuntimeException e) {
            return BaseResponse.builder()
                    .status(HttpStatus.NOT_FOUND.value())
                    .message(e.getMessage())
                    .data(null)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to delete Account Details: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    /**
     * One GL per (branch, purpose), and the customer wallet GL lives at Head Office only.
     *
     * @param selfId the row being updated, so it does not collide with itself; null on create
     */
    private void validatePurpose(Long branchId, GlPurpose purpose, Long selfId) {
        if (purpose == null) {
            return;
        }
        if (purpose == GlPurpose.CUSTOMER_WALLET && !branchId.equals(headOfficeBranchId())) {
            throw new RuntimeException("The Customer Wallet GL can only be created for the Head Office branch");
        }
        accountDetailsRepository.findByBranchIdAndGlPurpose(branchId, purpose)
                .filter(existing -> !existing.getId().equals(selfId))
                .ifPresent(existing -> {
                    throw new RuntimeException("This branch already has a " + purpose + " GL: "
                            + existing.getAccountDetailsCode() + " - " + existing.getAccountDetailsName());
                });
    }

    private Long headOfficeBranchId() {
        return branchRepository.findByHeadOfficeTrue()
                .map(Branch::getId)
                .orElseThrow(() -> new RuntimeException("Head Office branch is not configured"));
    }

    private BaseResponse forbidden(AccessDeniedException e) {
        return BaseResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message(e.getMessage())
                .data(null)
                .build();
    }
}

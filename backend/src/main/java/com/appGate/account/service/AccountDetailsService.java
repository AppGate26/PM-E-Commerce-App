package com.appGate.account.service;

import com.appGate.account.dto.CreateAccountDetailsDto;
import com.appGate.account.dto.UpdateAccountDetailsDto;
import com.appGate.account.models.Account;
import com.appGate.account.models.AccountDetails;
import com.appGate.account.repository.AccountDetailsRepository;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AccountDetailsService {

    private final AccountDetailsRepository accountDetailsRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public BaseResponse create(CreateAccountDetailsDto dto) {
        try {
            if (accountDetailsRepository.findByAccountDetailsCode(dto.getAccountDetailsCode()).isPresent()) {
                throw new RuntimeException("Account Details Code already exists");
            }
            AccountDetails accountDetails = new AccountDetails();
            accountDetails.setAccountTypeId(dto.getAccountTypeId());
            accountDetails.setControlAccountId(dto.getControlAccountId());
            accountDetails.setChartOfAccountId(dto.getChartOfAccountId());
            accountDetails.setAccountDetailsName(dto.getAccountDetailsName());
            accountDetails.setAccountDetailsCode(dto.getAccountDetailsCode());
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
                accountRepository.save(account);
            }

            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Account Details created successfully")
                    .data(saved)
                    .build();
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
            Page<AccountDetails> results = accountDetailsRepository.findAll(pageable);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(results)
                    .build();
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
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(accountDetails)
                    .build();
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
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Details retrieved successfully")
                    .data(accountDetailsRepository.findByChartOfAccountId(chartOfAccountId))
                    .build();
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
            accountDetails.setAccountDetailsName(dto.getAccountDetailsName());
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
        } catch (RuntimeException e) {
            return BaseResponse.builder()
                    .status(HttpStatus.NOT_FOUND.value())
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
}

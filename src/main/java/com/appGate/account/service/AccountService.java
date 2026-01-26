package com.appGate.account.service;

import com.appGate.account.dto.AccountDto;
import com.appGate.account.enums.AccountType;
import com.appGate.account.models.Account;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    @Transactional
    public BaseResponse createAccount(AccountDto dto) {
        try {
            // Check if GL Code already exists
            if (accountRepository.findByGlCode(dto.getGlCode()).isPresent()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "GL Code already exists", null);
            }

            Account account = new Account();
            account.setGlCode(dto.getGlCode());
            account.setAccountName(dto.getAccountName());
            account.setDescription(dto.getDescription());
            account.setAccountType(dto.getAccountType());
            account.setClassId(dto.getClassId() != null ? dto.getClassId() : getClassIdFromType(dto.getAccountType()));
            account.setIsControlAccount(dto.getIsControlAccount() != null ? dto.getIsControlAccount() : false);
            account.setParentAccountId(dto.getParentAccountId());
            account.setIsActive(true);

            Account savedAccount = accountRepository.save(account);
            return new BaseResponse(HttpStatus.CREATED.value(), "Account created successfully", savedAccount);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating account: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAllAccounts() {
        List<Account> accounts = accountRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Accounts retrieved successfully", accounts);
    }

    public BaseResponse getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Account retrieved successfully", account);
    }

    public BaseResponse getAccountByGlCode(String glCode) {
        Account account = accountRepository.findByGlCode(glCode)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Account retrieved successfully", account);
    }

    public BaseResponse getAccountsByType(AccountType accountType) {
        List<Account> accounts = accountRepository.findByAccountType(accountType);
        return new BaseResponse(HttpStatus.OK.value(), "Accounts retrieved successfully", accounts);
    }

    public BaseResponse getControlAccounts() {
        List<Account> accounts = accountRepository.findByIsControlAccountTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Control accounts retrieved successfully", accounts);
    }

    public BaseResponse getActiveAccounts() {
        List<Account> accounts = accountRepository.findByIsActiveTrue();
        return new BaseResponse(HttpStatus.OK.value(), "Active accounts retrieved successfully", accounts);
    }

    @Transactional
    public BaseResponse updateAccount(Long id, AccountDto dto) {
        try {
            Account account = accountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account not found"));

            if (dto.getAccountName() != null) {
                account.setAccountName(dto.getAccountName());
            }
            if (dto.getDescription() != null) {
                account.setDescription(dto.getDescription());
            }
            if (dto.getAccountType() != null) {
                account.setAccountType(dto.getAccountType());
                account.setClassId(getClassIdFromType(dto.getAccountType()));
            }
            if (dto.getIsControlAccount() != null) {
                account.setIsControlAccount(dto.getIsControlAccount());
            }

            Account updatedAccount = accountRepository.save(account);
            return new BaseResponse(HttpStatus.OK.value(), "Account updated successfully", updatedAccount);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating account: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteAccount(Long id) {
        try {
            Account account = accountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account not found"));
            accountRepository.delete(account);
            return new BaseResponse(HttpStatus.OK.value(), "Account deleted successfully", null);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting account: " + e.getMessage(), null);
        }
    }

    private Integer getClassIdFromType(AccountType type) {
        return switch (type) {
            case ASSET -> 1;
            case LIABILITY -> 2;
            case INCOME -> 4;
            case EXPENSE -> 5;
        };
    }
}

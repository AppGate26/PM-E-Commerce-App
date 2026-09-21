package com.appGate.account.service;

import com.appGate.account.dto.CreateAccountTypeDto;
import com.appGate.account.dto.UpdateAccountTypeDto;
import com.appGate.account.models.AccountType;
import com.appGate.account.repository.AccountTypeRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountTypeService {

    private final AccountTypeRepository accountTypeRepository;

    @Transactional
    public BaseResponse create(CreateAccountTypeDto dto) {
        try {
            AccountType accountType = new AccountType();
            accountType.setName(dto.getName());
            AccountType saved = accountTypeRepository.save(accountType);
            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Account Type created successfully")
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
                    .message("Failed to create Account Type: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<AccountType> results = accountTypeRepository.findAll(pageable);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Types retrieved successfully")
                    .data(results)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Account Types: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getById(Long id) {
        try {
            AccountType accountType = accountTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Type not found"));
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Type retrieved successfully")
                    .data(accountType)
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
                    .message("Failed to retrieve Account Type: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse update(Long id, UpdateAccountTypeDto dto) {
        try {
            AccountType accountType = accountTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Type not found"));
            accountType.setName(dto.getName());
            AccountType updated = accountTypeRepository.save(accountType);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Type updated successfully")
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
                    .message("Failed to update Account Type: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse delete(Long id) {
        try {
            AccountType accountType = accountTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Account Type not found"));
            accountTypeRepository.delete(accountType);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Account Type deleted successfully")
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
                    .message("Failed to delete Account Type: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }
}

package com.appGate.account.service;

import com.appGate.account.dto.CreateControlAccountDto;
import com.appGate.account.dto.UpdateControlAccountDto;
import com.appGate.account.models.ControlAccount;
import com.appGate.account.repository.ControlAccountRepository;
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
public class ControlAccountService {

    private final ControlAccountRepository controlAccountRepository;

    @Transactional
    public BaseResponse create(CreateControlAccountDto dto) {
        try {
            if (controlAccountRepository.findByControlId(dto.getControlId()).isPresent()) {
                throw new RuntimeException("Control ID already exists");
            }
            ControlAccount controlAccount = new ControlAccount();
            controlAccount.setAccountTypeId(dto.getAccountTypeId());
            controlAccount.setControlId(dto.getControlId());
            controlAccount.setName(dto.getName());
            ControlAccount saved = controlAccountRepository.save(controlAccount);

            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Control Account created successfully")
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
                    .message("Failed to create Control Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ControlAccount> results = controlAccountRepository.findAll(pageable);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Control Accounts retrieved successfully")
                    .data(results)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Control Accounts: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getById(Long id) {
        try {
            ControlAccount controlAccount = controlAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Control Account not found"));
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Control Account retrieved successfully")
                    .data(controlAccount)
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
                    .message("Failed to retrieve Control Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getByAccountTypeId(Long accountTypeId) {
        try {
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Control Accounts retrieved successfully")
                    .data(controlAccountRepository.findByAccountTypeId(accountTypeId))
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Control Accounts: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse update(Long id, UpdateControlAccountDto dto) {
        try {
            ControlAccount controlAccount = controlAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Control Account not found"));
            controlAccount.setName(dto.getName());
            ControlAccount updated = controlAccountRepository.save(controlAccount);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Control Account updated successfully")
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
                    .message("Failed to update Control Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse delete(Long id) {
        try {
            ControlAccount controlAccount = controlAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Control Account not found"));
            controlAccountRepository.delete(controlAccount);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Control Account deleted successfully")
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
                    .message("Failed to delete Control Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }
}

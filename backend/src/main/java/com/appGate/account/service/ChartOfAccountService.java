package com.appGate.account.service;

import com.appGate.account.dto.CreateChartOfAccountDto;
import com.appGate.account.dto.UpdateChartOfAccountDto;
import com.appGate.account.models.ChartOfAccount;
import com.appGate.account.repository.ChartOfAccountRepository;
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
public class ChartOfAccountService {

    private final ChartOfAccountRepository chartOfAccountRepository;

    @Transactional
    public BaseResponse create(CreateChartOfAccountDto dto) {
        try {
            if (chartOfAccountRepository.findByChartOfAccountId(dto.getChartOfAccountId()).isPresent()) {
                throw new RuntimeException("Chart of Account ID already exists");
            }
            ChartOfAccount chartOfAccount = new ChartOfAccount();
            chartOfAccount.setAccountTypeId(dto.getAccountTypeId());
            chartOfAccount.setControlAccountId(dto.getControlAccountId());
            chartOfAccount.setDescription(dto.getDescription());
            chartOfAccount.setChartOfAccountId(dto.getChartOfAccountId());
            ChartOfAccount saved = chartOfAccountRepository.save(chartOfAccount);

            return BaseResponse.builder()
                    .status(HttpStatus.CREATED.value())
                    .message("Chart Of Account created successfully")
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
                    .message("Failed to create Chart Of Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getAll(int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ChartOfAccount> results = chartOfAccountRepository.findAll(pageable);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Chart Of Accounts retrieved successfully")
                    .data(results)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Chart Of Accounts: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getById(Long id) {
        try {
            ChartOfAccount chartOfAccount = chartOfAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Chart Of Account not found"));
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Chart Of Account retrieved successfully")
                    .data(chartOfAccount)
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
                    .message("Failed to retrieve Chart Of Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    public BaseResponse getByControlAccountId(Long controlAccountId) {
        try {
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Chart Of Accounts retrieved successfully")
                    .data(chartOfAccountRepository.findByControlAccountId(controlAccountId))
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve Chart Of Accounts: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse update(Long id, UpdateChartOfAccountDto dto) {
        try {
            ChartOfAccount chartOfAccount = chartOfAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Chart Of Account not found"));
            chartOfAccount.setDescription(dto.getDescription());
            ChartOfAccount updated = chartOfAccountRepository.save(chartOfAccount);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Chart Of Account updated successfully")
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
                    .message("Failed to update Chart Of Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }

    @Transactional
    public BaseResponse delete(Long id) {
        try {
            ChartOfAccount chartOfAccount = chartOfAccountRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Chart Of Account not found"));
            chartOfAccountRepository.delete(chartOfAccount);
            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Chart Of Account deleted successfully")
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
                    .message("Failed to delete Chart Of Account: " + e.getMessage())
                    .data(null)
                    .build();
        }
    }
}

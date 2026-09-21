package com.appGate.account.service;

import com.appGate.account.dto.CustomerBalanceSummaryDto;
import com.appGate.account.dto.MainBalanceEntryDto;
import com.appGate.account.models.Wallet;
import com.appGate.account.repository.InstallmentPlanRepository;
import com.appGate.account.repository.InstallmentRepository;
import com.appGate.account.repository.TransactionRepository;
import com.appGate.account.repository.WalletRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminBalanceService {

    private final WalletRepository walletRepository;
    private final InstallmentPlanRepository installmentPlanRepository;
    private final TransactionRepository transactionRepository;
    private final InstallmentRepository installmentRepository;
    private final UserRepository userRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;

    /** Active wallets the caller may see: their branch's, or all for head office. */
    private Page<Wallet> scopedActiveWallets(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Long branchId = branchScopeService.getScopedBranchId();
        return branchId == null
                ? walletRepository.findAllByIsActiveTrue(pageable)
                : walletRepository.findAllByIsActiveTrueAndBranchId(branchId, pageable);
    }

    public BaseResponse getCustomerBalances(int page, int size) {
        Page<Wallet> wallets = scopedActiveWallets(page, size);

        List<CustomerBalanceSummaryDto> summaries = new ArrayList<>();

        for (Wallet wallet : wallets.getContent()) {
            User user = userRepository.findById(wallet.getUserId()).orElse(null);
            if (user == null) continue;

            String customerName = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                    (user.getLastName() != null ? user.getLastName() : "");

            LocalDateTime lastTransactionDate = transactionRepository
                    .findLastTransactionDateByUser(wallet.getUserId());

            LocalDate lastRepaymentDate = installmentRepository
                    .findLastRepaymentDateByUser(wallet.getUserId());

            Double loanBalance = installmentPlanRepository
                    .sumActiveLoanBalanceByUser(wallet.getUserId());

            summaries.add(CustomerBalanceSummaryDto.builder()
                    .customerName(customerName.trim())
                    .customerId(user.getId())
                    .lastTransactionDate(lastTransactionDate)
                    .lastRepaymentDate(lastRepaymentDate)
                    .walletBalance(wallet.getBalance())
                    .loanBalance(loanBalance != null ? loanBalance : 0.0)
                    .build());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("content", summaries);
        data.put("totalElements", wallets.getTotalElements());
        data.put("totalPages", wallets.getTotalPages());
        data.put("currentPage", wallets.getNumber());

        return BaseResponse.builder()
                .status(200)
                .message("Customer balances retrieved successfully")
                .data(data)
                .build();
    }

    public BaseResponse getMainBalance(int page, int size) {
        // The headline total has to match the rows beneath it: a branch user seeing
        // only their branch's wallets must not be shown the company-wide sum.
        Long branchId = branchScopeService.getScopedBranchId();
        Double totalWalletBalance = branchId == null
                ? walletRepository.sumAllActiveBalances()
                : walletRepository.sumActiveBalancesByBranch(branchId);
        Double totalLoanBalance = installmentPlanRepository.sumAllActiveLoanBalances();

        Page<Wallet> wallets = scopedActiveWallets(page, size);

        List<MainBalanceEntryDto> entries = new ArrayList<>();

        for (Wallet wallet : wallets.getContent()) {
            User user = userRepository.findById(wallet.getUserId()).orElse(null);
            if (user == null) continue;

            String customerName = (user.getFirstName() != null ? user.getFirstName() : "") + " " +
                    (user.getLastName() != null ? user.getLastName() : "");

            LocalDateTime lastTransactionDate = transactionRepository
                    .findLastTransactionDateByUser(wallet.getUserId());

            entries.add(MainBalanceEntryDto.builder()
                    .customerName(customerName.trim())
                    .accountNumber(wallet.getAccountNumber())
                    .amount(wallet.getBalance())
                    .dateOfTransaction(lastTransactionDate)
                    .build());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("totalWalletBalance", totalWalletBalance != null ? totalWalletBalance : 0.0);
        data.put("totalLoanBalance", totalLoanBalance != null ? totalLoanBalance : 0.0);
        data.put("transactions", entries);
        data.put("totalElements", wallets.getTotalElements());
        data.put("totalPages", wallets.getTotalPages());
        data.put("currentPage", wallets.getNumber());

        return BaseResponse.builder()
                .status(200)
                .message("Main balance retrieved successfully")
                .data(data)
                .build();
    }
}

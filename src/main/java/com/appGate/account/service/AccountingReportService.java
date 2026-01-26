package com.appGate.account.service;

import com.appGate.account.enums.AccountType;
import com.appGate.account.models.Account;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.repository.JournalLineRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AccountingReportService {

    private final AccountRepository accountRepository;
    private final JournalLineRepository journalLineRepository;

    public BaseResponse getJournalReport(LocalDate startDate, LocalDate endDate, String referenceNo) {
        try {
            List<JournalLine> lines = journalLineRepository.findByDateRange(startDate, endDate);

            if (referenceNo != null && !referenceNo.isEmpty()) {
                lines = lines.stream()
                        .filter(line -> referenceNo.equals(line.getReferenceNo()))
                        .toList();
            }

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Journal Report");
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            report.put("journalEntries", lines);
            report.put("totalDebit", lines.stream()
                    .map(JournalLine::getDebit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            report.put("totalCredit", lines.stream()
                    .map(JournalLine::getCredit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            return new BaseResponse(HttpStatus.OK.value(), "Journal report generated successfully", report);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating journal report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getTrialBalance(LocalDate asOfDate, String reportType) {
        try {
            List<Account> accounts = accountRepository.findByIsActiveTrue();

            List<Map<String, Object>> trialBalanceLines = new ArrayList<>();
            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;

            for (Account account : accounts) {
                Map<String, Object> line = new HashMap<>();
                line.put("accountName", account.getAccountName());
                line.put("glCode", account.getGlCode());
                line.put("accountType", account.getAccountType());

                BigDecimal balance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;

                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    line.put("debit", balance);
                    line.put("credit", BigDecimal.ZERO);
                    totalDebit = totalDebit.add(balance);
                } else {
                    line.put("debit", BigDecimal.ZERO);
                    line.put("credit", balance.abs());
                    totalCredit = totalCredit.add(balance.abs());
                }

                trialBalanceLines.add(line);
            }

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Trial Balance - " + reportType);
            report.put("asOfDate", asOfDate);
            report.put("accounts", trialBalanceLines);
            report.put("totalDebit", totalDebit);
            report.put("totalCredit", totalCredit);
            report.put("balanced", totalDebit.compareTo(totalCredit) == 0);

            return new BaseResponse(HttpStatus.OK.value(), "Trial balance generated successfully", report);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating trial balance: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProfitAndLoss(LocalDate startDate, LocalDate endDate, String reportType) {
        try {
            List<Account> incomeAccounts = accountRepository.findByAccountType(AccountType.INCOME);
            List<Account> expenseAccounts = accountRepository.findByAccountType(AccountType.EXPENSE);

            BigDecimal totalIncome = incomeAccounts.stream()
                    .map(acc -> acc.getBalance() != null ? acc.getBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpenses = expenseAccounts.stream()
                    .map(acc -> acc.getBalance() != null ? acc.getBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netProfitOrLoss = totalIncome.subtract(totalExpenses);

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Profit & Loss Statement - " + reportType);
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            report.put("incomeAccounts", incomeAccounts);
            report.put("totalIncome", totalIncome);
            report.put("expenseAccounts", expenseAccounts);
            report.put("totalExpenses", totalExpenses);
            report.put("netProfitOrLoss", netProfitOrLoss);
            report.put("isProfitable", netProfitOrLoss.compareTo(BigDecimal.ZERO) > 0);

            return new BaseResponse(HttpStatus.OK.value(), "Profit & Loss report generated successfully", report);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating P&L report: " + e.getMessage(), null);
        }
    }
}

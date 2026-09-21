package com.appGate.account.service;

import com.appGate.account.models.Account;
import com.appGate.account.models.AccountType;
import com.appGate.account.models.JournalEntry;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.repository.AccountTypeRepository;
import com.appGate.account.repository.JournalEntryRepository;
import com.appGate.account.repository.JournalLineRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class AccountingReportService {

    private final AccountRepository accountRepository;
    private final JournalLineRepository journalLineRepository;
    private final AccountTypeRepository accountTypeRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final BranchScopeService branchScopeService;

    /**
     * An account's balance <em>at one branch</em>, keyed by account id.
     *
     * <p>The chart of accounts is shared across the company, so {@code
     * Account.balance} is a single company-wide figure — it cannot answer "what
     * is this account's balance at my branch". The branch figure is therefore
     * derived from the journal: the debits and credits on the lines of entries
     * posted by that branch.
     *
     * <p>The debit/credit signs are applied exactly as
     * {@code JournalEntryService.updateAccountBalance} applies them when it
     * maintains {@code Account.balance} — asset and expense accounts increase on
     * debit, everything else increases on credit. If the two disagreed, a branch
     * trial balance would not tie while the company-wide one did.
     */
    private Map<Long, BigDecimal> branchBalances(List<Object[]> rows, Map<Long, Long> accountTypeById) {
        Long assetTypeId = accountTypeRepository.findByName("ASSET").map(AccountType::getId).orElse(null);
        Long expenseTypeId = accountTypeRepository.findByName("EXPENSE").map(AccountType::getId).orElse(null);

        Map<Long, BigDecimal> balances = new HashMap<>();
        for (Object[] row : rows) {
            Long accountId = ((Number) row[0]).longValue();
            BigDecimal debit = toBigDecimal(row[1]);
            BigDecimal credit = toBigDecimal(row[2]);

            Long accountTypeId = accountTypeById.get(accountId);
            boolean debitPositive = (assetTypeId != null && assetTypeId.equals(accountTypeId))
                    || (expenseTypeId != null && expenseTypeId.equals(accountTypeId));

            balances.put(accountId, debitPositive ? debit.subtract(credit) : credit.subtract(debit));
        }
        return balances;
    }

    private Map<Long, Long> accountTypesOf(List<Account> accounts) {
        Map<Long, Long> byId = new HashMap<>();
        for (Account account : accounts) {
            byId.put(account.getId(), account.getAccountTypeId());
        }
        return byId;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        return BigDecimal.valueOf(((Number) value).doubleValue());
    }

    // Branch module: journal entries posted for a branch (optionally within a date range),
    // with debit/credit totals aggregated from their journal lines.
    public BaseResponse getBranchJournalReport(Long branchId, LocalDate startDate, LocalDate endDate) {
        try {
            // A branch user may only ask for their own branch; an admin may ask for any.
            Long scopedBranchId = branchScopeService.resolveReadBranchId(branchId);

            List<JournalEntry> entries = (startDate != null && endDate != null)
                    ? journalEntryRepository
                            .findByBranchIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                                    scopedBranchId, startDate, endDate)
                    : journalEntryRepository.findByBranchIdOrderByTransactionDateDesc(scopedBranchId);

            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;
            for (JournalEntry entry : entries) {
                if (entry.getJournalLines() == null) continue;
                for (JournalLine line : entry.getJournalLines()) {
                    if (line.getDebit() != null) totalDebit = totalDebit.add(line.getDebit());
                    if (line.getCredit() != null) totalCredit = totalCredit.add(line.getCredit());
                }
            }

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Branch Account (Journal) Report");
            report.put("branchId", scopedBranchId);
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            report.put("journalEntries", entries);
            report.put("totalDebit", totalDebit);
            report.put("totalCredit", totalCredit);

            return new BaseResponse(HttpStatus.OK.value(), "Branch journal report generated successfully", report);
        } catch (AccessDeniedException e) {
            // Must surface as a 403, not be flattened into "report failed".
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating branch journal report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getJournalReport(LocalDate startDate, LocalDate endDate, String referenceNo) {
        try {
            // Branch users only see journal activity posted by their own branch. The
            // filter is pushed into the query rather than applied after loading every
            // line in the company.
            final Long scopedBranchId = branchScopeService.getScopedBranchId();
            List<JournalLine> lines = scopedBranchId == null
                    ? journalLineRepository.findByDateRange(startDate, endDate)
                    : journalLineRepository.findByBranchAndDateRange(scopedBranchId, startDate, endDate);

            if (referenceNo != null && !referenceNo.isEmpty()) {
                lines = lines.stream()
                        .filter(line -> referenceNo.equals(line.getReferenceNo()))
                        .toList();
            }

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Journal Report");
            report.put("branchId", scopedBranchId);
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
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating journal report: " + e.getMessage(), null);
        }
    }

    public BaseResponse getTrialBalance(LocalDate asOfDate, String reportType) {
        try {
            final Long scopedBranchId = branchScopeService.getScopedBranchId();

            final List<Account> accounts;
            final Function<Account, BigDecimal> balanceOf;

            if (scopedBranchId == null) {
                accounts = accountRepository.findByIsActiveTrue();
                balanceOf = account -> account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
            } else {
                accounts = accountRepository.findActiveVisibleToBranch(scopedBranchId);
                Map<Long, BigDecimal> branchBalances = branchBalances(
                        journalLineRepository.sumByAccountForBranch(scopedBranchId, asOfDate),
                        accountTypesOf(accounts));
                balanceOf = account -> branchBalances.getOrDefault(account.getId(), BigDecimal.ZERO);
            }

            List<Map<String, Object>> trialBalanceLines = new ArrayList<>();
            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;

            for (Account account : accounts) {
                Map<String, Object> line = new HashMap<>();
                line.put("accountName", account.getAccountName());
                line.put("glCode", account.getGlCode());
                line.put("accountTypeId", account.getAccountTypeId());

                BigDecimal balance = balanceOf.apply(account);

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
            report.put("branchId", scopedBranchId);
            report.put("asOfDate", asOfDate);
            report.put("accounts", trialBalanceLines);
            report.put("totalDebit", totalDebit);
            report.put("totalCredit", totalCredit);
            report.put("balanced", totalDebit.compareTo(totalCredit) == 0);

            return new BaseResponse(HttpStatus.OK.value(), "Trial balance generated successfully", report);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating trial balance: " + e.getMessage(), null);
        }
    }

    public BaseResponse getProfitAndLoss(LocalDate startDate, LocalDate endDate, String reportType) {
        try {
            Long incomeAccountTypeId = accountTypeRepository.findByName("INCOME")
                    .map(AccountType::getId)
                    .orElse(null);
            Long expenseAccountTypeId = accountTypeRepository.findByName("EXPENSE")
                    .map(AccountType::getId)
                    .orElse(null);

            final Long scopedBranchId = branchScopeService.getScopedBranchId();

            final List<Account> incomeAccounts;
            final List<Account> expenseAccounts;
            final Function<Account, BigDecimal> balanceOf;

            if (scopedBranchId == null) {
                incomeAccounts = incomeAccountTypeId != null
                        ? accountRepository.findByAccountTypeId(incomeAccountTypeId)
                        : new ArrayList<>();
                expenseAccounts = expenseAccountTypeId != null
                        ? accountRepository.findByAccountTypeId(expenseAccountTypeId)
                        : new ArrayList<>();
                balanceOf = account -> account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
            } else {
                incomeAccounts = incomeAccountTypeId != null
                        ? accountRepository.findByAccountTypeIdVisibleToBranch(incomeAccountTypeId, scopedBranchId)
                        : new ArrayList<>();
                expenseAccounts = expenseAccountTypeId != null
                        ? accountRepository.findByAccountTypeIdVisibleToBranch(expenseAccountTypeId, scopedBranchId)
                        : new ArrayList<>();
                List<Account> pnlAccounts = new ArrayList<>(incomeAccounts);
                pnlAccounts.addAll(expenseAccounts);
                Map<Long, BigDecimal> branchBalances = branchBalances(
                        journalLineRepository.sumByAccountForBranchBetween(scopedBranchId, startDate, endDate),
                        accountTypesOf(pnlAccounts));
                balanceOf = account -> branchBalances.getOrDefault(account.getId(), BigDecimal.ZERO);
            }

            BigDecimal totalIncome = incomeAccounts.stream()
                    .map(balanceOf)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalExpenses = expenseAccounts.stream()
                    .map(balanceOf)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netProfitOrLoss = totalIncome.subtract(totalExpenses);

            Map<String, Object> report = new HashMap<>();
            report.put("reportTitle", "Profit & Loss Statement - " + reportType);
            report.put("branchId", scopedBranchId);
            report.put("startDate", startDate);
            report.put("endDate", endDate);
            report.put("incomeAccounts", incomeAccounts);
            report.put("totalIncome", totalIncome);
            report.put("expenseAccounts", expenseAccounts);
            report.put("totalExpenses", totalExpenses);
            report.put("netProfitOrLoss", netProfitOrLoss);
            report.put("isProfitable", netProfitOrLoss.compareTo(BigDecimal.ZERO) > 0);

            return new BaseResponse(HttpStatus.OK.value(), "Profit & Loss report generated successfully", report);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error generating P&L report: " + e.getMessage(), null);
        }
    }
}

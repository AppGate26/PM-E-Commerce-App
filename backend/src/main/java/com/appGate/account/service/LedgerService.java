package com.appGate.account.service;

import com.appGate.account.dto.AccountLedgerLineDto;
import com.appGate.account.models.JournalEntry;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.JournalLineRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Ledger views. A journal line belongs to the branch that posted its entry, so a
 * branch user's ledger only ever shows their own branch's activity.
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final JournalLineRepository journalLineRepository;
    private final UserRepository userRepository;
    private final BranchScopeService branchScopeService;

    public BaseResponse getGeneralLedger(LocalDate startDate, LocalDate endDate, String referenceNo) {
        try {
            Long branchId = branchScopeService.getScopedBranchId();
            List<JournalLine> lines = branchId == null
                    ? journalLineRepository.findByDateRange(startDate, endDate)
                    : journalLineRepository.findByBranchAndDateRange(branchId, startDate, endDate);

            // Filter by reference number if provided
            if (referenceNo != null && !referenceNo.isEmpty()) {
                lines = lines.stream()
                        .filter(line -> referenceNo.equals(resolveReferenceNo(line)))
                        .toList();
            }

            return new BaseResponse(HttpStatus.OK.value(), "General ledger retrieved successfully",
                    buildLedgerResponse(lines));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving general ledger: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAccountLedger(Long accountId, LocalDate startDate, LocalDate endDate) {
        try {
            Long branchId = branchScopeService.getScopedBranchId();
            List<JournalLine> lines = branchId == null
                    ? journalLineRepository.findByAccountAndDateRange(accountId, startDate, endDate)
                    : journalLineRepository.findByAccountAndDateRangeForBranch(
                            accountId, branchId, startDate, endDate);

            return new BaseResponse(HttpStatus.OK.value(), "Account ledger retrieved successfully",
                    buildLedgerResponse(lines));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving account ledger: " + e.getMessage(), null);
        }
    }

    public BaseResponse getCustomerLedger(Long userId, LocalDate startDate, LocalDate endDate) {
        try {
            Long branchId = branchScopeService.getScopedBranchId();
            List<JournalLine> lines = branchId == null
                    ? journalLineRepository.findByUserAndDateRange(userId, startDate, endDate)
                    : journalLineRepository.findByUserAndDateRangeForBranch(
                            userId, branchId, startDate, endDate);

            return new BaseResponse(HttpStatus.OK.value(), "Customer ledger retrieved successfully",
                    buildLedgerResponse(lines));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving customer ledger: " + e.getMessage(), null);
        }
    }

    private String resolveReferenceNo(JournalLine line) {
        JournalEntry entry = line.getJournalEntry();
        if (entry != null && entry.getJournalReference() != null) {
            return entry.getJournalReference();
        }
        return line.getReferenceNo();
    }

    /** Builds the {transactions, totalDebit, totalCredit} payload the frontend expects. */
    private Map<String, Object> buildLedgerResponse(List<JournalLine> lines) {
        List<AccountLedgerLineDto> dtos = toDtos(lines);

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", dtos);
        response.put("totalDebit", lines.stream()
                .map(JournalLine::getDebit)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        response.put("totalCredit", lines.stream()
                .map(JournalLine::getCredit)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        return response;
    }

    /**
     * Enriches each line with its parent entry's date/reference/approval fields —
     * {@code JournalLine.journalEntry} is {@code @JsonBackReference} and would
     * otherwise vanish from the JSON entirely, leaving the caller with no date to
     * show. User ids (posted/approved/customer) are resolved to names in one
     * batch query rather than one lookup per line.
     */
    private List<AccountLedgerLineDto> toDtos(List<JournalLine> lines) {
        Set<Long> userIds = new HashSet<>();
        for (JournalLine line : lines) {
            JournalEntry entry = line.getJournalEntry();
            if (entry != null) {
                if (entry.getPostedBy() != null) userIds.add(entry.getPostedBy());
                if (entry.getApprovedBy() != null) userIds.add(entry.getApprovedBy());
            }
            if (line.getUserId() != null) userIds.add(line.getUserId());
        }

        Map<Long, String> namesById = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User user : userRepository.findAllById(userIds)) {
                String name = String.join(" ",
                        java.util.Optional.ofNullable(user.getFirstName()).orElse(""),
                        java.util.Optional.ofNullable(user.getLastName()).orElse("")).trim();
                namesById.put(user.getId(), name.isEmpty() ? user.getEmail() : name);
            }
        }

        return lines.stream().map(line -> {
            JournalEntry entry = line.getJournalEntry();
            return new AccountLedgerLineDto(
                    line.getId(),
                    entry != null ? entry.getId() : null,
                    entry != null ? entry.getTransactionDate() : null,
                    resolveReferenceNo(line),
                    "JOURNAL",
                    line.getDescription() != null ? line.getDescription()
                            : (entry != null ? entry.getDescription() : null),
                    line.getAccount() != null ? line.getAccount().getId() : null,
                    line.getAccount() != null ? line.getAccount().getGlCode() : null,
                    line.getAccount() != null ? line.getAccount().getAccountName() : null,
                    line.getUserId() != null ? namesById.get(line.getUserId()) : null,
                    line.getDebit(),
                    line.getCredit(),
                    entry != null ? namesById.get(entry.getPostedBy()) : null,
                    entry != null ? namesById.get(entry.getApprovedBy()) : null,
                    entry != null ? entry.getIsApproved() : null
            );
        }).toList();
    }
}

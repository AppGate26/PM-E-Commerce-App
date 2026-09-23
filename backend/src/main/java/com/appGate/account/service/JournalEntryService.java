package com.appGate.account.service;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.JournalLineDto;
import com.appGate.account.models.Account;
import com.appGate.account.models.AccountType;
import com.appGate.account.models.JournalEntry;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.repository.AccountTypeRepository;
import com.appGate.account.repository.JournalEntryRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.service.BranchScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;
    private final AccountTypeRepository accountTypeRepository;
    private final BranchScopeService branchScopeService;

    @Transactional
    public BaseResponse createJournalEntry(CreateJournalEntryDto dto, Long userId) {
        try {
            // Validate debit/credit balance
            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;

            for (JournalLineDto lineDto : dto.getJournalLines()) {
                if (lineDto.getDebit() != null) {
                    totalDebit = totalDebit.add(lineDto.getDebit());
                }
                if (lineDto.getCredit() != null) {
                    totalCredit = totalCredit.add(lineDto.getCredit());
                }
            }

            if (totalDebit.compareTo(totalCredit) != 0) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Debit and credit amounts must be equal. Debit: " + totalDebit + ", Credit: " + totalCredit, null);
            }

            // Use the client-supplied reference when provided (must be unique),
            // otherwise auto-generate one.
            String reference;
            if (dto.getJournalReference() != null && !dto.getJournalReference().isBlank()) {
                reference = dto.getJournalReference().trim();
                if (journalEntryRepository.findByJournalReference(reference).isPresent()) {
                    return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                            "Journal reference '" + reference + "' already exists", null);
                }
            } else {
                reference = generateJournalReference();
            }

            JournalEntry journalEntry = new JournalEntry();
            journalEntry.setJournalReference(reference);
            journalEntry.setJournalType(dto.getJournalType());
            journalEntry.setTransactionDate(dto.getTransactionDate());
            journalEntry.setDescription(dto.getDescription());
            journalEntry.setPostedBy(userId);
            journalEntry.setIsApproved(false);
            // A branch user always posts into their own branch, whatever the DTO says.
            journalEntry.setBranchId(branchScopeService.resolveWriteBranchId(dto.getBranchId()));

            // Create journal lines
            for (JournalLineDto lineDto : dto.getJournalLines()) {
                Account account = accountRepository.findById(lineDto.getAccountId())
                        .orElseThrow(() -> new RuntimeException("Account not found: " + lineDto.getAccountId()));

                JournalLine journalLine = new JournalLine();
                journalLine.setJournalEntry(journalEntry);
                journalLine.setAccount(account);
                journalLine.setDescription(lineDto.getDescription());
                journalLine.setDebit(lineDto.getDebit() != null ? lineDto.getDebit() : BigDecimal.ZERO);
                journalLine.setCredit(lineDto.getCredit() != null ? lineDto.getCredit() : BigDecimal.ZERO);
                journalLine.setUserId(lineDto.getUserId());
                journalLine.setReferenceNo(lineDto.getReferenceNo());

                journalEntry.getJournalLines().add(journalLine);

                // Update account balance
                updateAccountBalance(account, journalLine.getDebit(), journalLine.getCredit());
            }

            JournalEntry savedEntry = journalEntryRepository.save(journalEntry);
            return new BaseResponse(HttpStatus.CREATED.value(), "Journal entry created successfully", savedEntry);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating journal entry: " + e.getMessage(), null);
        }
    }

    /**
     * Posts a journal on behalf of the system (Paystack webhook, wallet flows) rather than a user.
     *
     * <p>Unlike {@link #createJournalEntry}, the branch is taken as given instead of being
     * resolved from the request's branch scope, because these postings often run with no
     * logged-in user (e.g. the Paystack webhook). Entries are approved on creation, which
     * also locks them against edits and deletion. Failures throw so the caller's transaction
     * rolls back cleanly.
     *
     * @return true when posted; false when an entry with the same reference already exists
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean createSystemJournalEntry(CreateJournalEntryDto dto, Long branchId) {
        String reference = dto.getJournalReference();
        if (journalEntryRepository.findByJournalReference(reference).isPresent()) {
            return false;
        }

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        for (JournalLineDto lineDto : dto.getJournalLines()) {
            totalDebit = totalDebit.add(lineDto.getDebit() != null ? lineDto.getDebit() : BigDecimal.ZERO);
            totalCredit = totalCredit.add(lineDto.getCredit() != null ? lineDto.getCredit() : BigDecimal.ZERO);
        }
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException(
                    "Debit and credit amounts must be equal. Debit: " + totalDebit + ", Credit: " + totalCredit);
        }

        JournalEntry journalEntry = new JournalEntry();
        journalEntry.setJournalReference(reference);
        journalEntry.setJournalType(dto.getJournalType());
        journalEntry.setTransactionDate(dto.getTransactionDate());
        journalEntry.setDescription(dto.getDescription());
        journalEntry.setIsApproved(true);
        journalEntry.setBranchId(branchId);

        for (JournalLineDto lineDto : dto.getJournalLines()) {
            Account account = accountRepository.findById(lineDto.getAccountId())
                    .orElseThrow(() -> new IllegalStateException("Account not found: " + lineDto.getAccountId()));

            JournalLine journalLine = new JournalLine();
            journalLine.setJournalEntry(journalEntry);
            journalLine.setAccount(account);
            journalLine.setDescription(lineDto.getDescription());
            journalLine.setDebit(lineDto.getDebit() != null ? lineDto.getDebit() : BigDecimal.ZERO);
            journalLine.setCredit(lineDto.getCredit() != null ? lineDto.getCredit() : BigDecimal.ZERO);
            journalLine.setUserId(lineDto.getUserId());
            journalLine.setReferenceNo(lineDto.getReferenceNo());
            journalEntry.getJournalLines().add(journalLine);

            updateAccountBalance(account, journalLine.getDebit(), journalLine.getCredit());
        }

        journalEntryRepository.save(journalEntry);
        return true;
    }

    public BaseResponse getAllJournalEntries() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<JournalEntry> entries = branchId == null
                ? journalEntryRepository.findAll()
                : journalEntryRepository.findByBranchIdOrderByTransactionDateDesc(branchId);
        return new BaseResponse(HttpStatus.OK.value(), "Journal entries retrieved successfully", entries);
    }

    public BaseResponse getJournalEntryById(Long id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal entry not found"));
        branchScopeService.assertCanAccess(entry.getBranchId());
        return new BaseResponse(HttpStatus.OK.value(), "Journal entry retrieved successfully", entry);
    }

    public BaseResponse getJournalEntriesByDateRange(LocalDate startDate, LocalDate endDate) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<JournalEntry> entries = branchId == null
                ? journalEntryRepository.findByTransactionDateBetween(startDate, endDate)
                : journalEntryRepository.findByBranchIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                        branchId, startDate, endDate);
        return new BaseResponse(HttpStatus.OK.value(), "Journal entries retrieved successfully", entries);
    }

    @Transactional
    public BaseResponse approveJournalEntry(Long id, Long approvedByUserId) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));
            branchScopeService.assertCanAccess(entry.getBranchId());

            entry.setIsApproved(true);
            entry.setApprovedBy(approvedByUserId);

            JournalEntry updatedEntry = journalEntryRepository.save(entry);
            return new BaseResponse(HttpStatus.OK.value(), "Journal entry approved successfully", updatedEntry);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error approving journal entry: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse patchJournalEntry(Long id, java.util.Map<String, Object> updates) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));
            branchScopeService.assertCanAccess(entry.getBranchId());

            if (entry.getIsApproved()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot edit an approved journal entry", null);
            }

            if (updates.containsKey("description")) {
                entry.setDescription(String.valueOf(updates.get("description")));
            }
            if (updates.containsKey("transactionDate")) {
                entry.setTransactionDate(LocalDate.parse(String.valueOf(updates.get("transactionDate"))));
            }
            if (updates.containsKey("journalType")) {
                try {
                    entry.setJournalType(com.appGate.account.enums.JournalType.valueOf(
                            String.valueOf(updates.get("journalType"))));
                } catch (IllegalArgumentException ignored) {}
            }

            JournalEntry updated = journalEntryRepository.save(entry);
            return new BaseResponse(HttpStatus.OK.value(), "Journal entry updated successfully", updated);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating journal entry: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse updateJournalEntry(Long id, CreateJournalEntryDto dto, Long userId) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));
            branchScopeService.assertCanAccess(entry.getBranchId());

            if (entry.getIsApproved()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot edit an approved journal entry", null);
            }

            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;
            for (JournalLineDto lineDto : dto.getJournalLines()) {
                if (lineDto.getDebit() != null) totalDebit = totalDebit.add(lineDto.getDebit());
                if (lineDto.getCredit() != null) totalCredit = totalCredit.add(lineDto.getCredit());
            }
            if (totalDebit.compareTo(totalCredit) != 0) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Debit and credit amounts must be equal. Debit: " + totalDebit + ", Credit: " + totalCredit, null);
            }

            // Reverse old account balance changes
            for (JournalLine line : entry.getJournalLines()) {
                updateAccountBalance(line.getAccount(), line.getCredit(), line.getDebit());
            }

            entry.setJournalType(dto.getJournalType());
            entry.setTransactionDate(dto.getTransactionDate());
            entry.setDescription(dto.getDescription());
            entry.setPostedBy(userId);
            entry.getJournalLines().clear();

            for (JournalLineDto lineDto : dto.getJournalLines()) {
                Account account = accountRepository.findById(lineDto.getAccountId())
                        .orElseThrow(() -> new RuntimeException("Account not found: " + lineDto.getAccountId()));

                JournalLine journalLine = new JournalLine();
                journalLine.setJournalEntry(entry);
                journalLine.setAccount(account);
                journalLine.setDescription(lineDto.getDescription());
                journalLine.setDebit(lineDto.getDebit() != null ? lineDto.getDebit() : BigDecimal.ZERO);
                journalLine.setCredit(lineDto.getCredit() != null ? lineDto.getCredit() : BigDecimal.ZERO);
                journalLine.setUserId(lineDto.getUserId());
                journalLine.setReferenceNo(lineDto.getReferenceNo());

                entry.getJournalLines().add(journalLine);
                updateAccountBalance(account, journalLine.getDebit(), journalLine.getCredit());
            }

            JournalEntry updated = journalEntryRepository.save(entry);
            return new BaseResponse(HttpStatus.OK.value(), "Journal entry updated successfully", updated);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error updating journal entry: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteJournalEntry(Long id) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));
            branchScopeService.assertCanAccess(entry.getBranchId());

            if (entry.getIsApproved()) {
                return new BaseResponse(HttpStatus.BAD_REQUEST.value(),
                        "Cannot delete approved journal entry", null);
            }

            // Reverse account balance changes
            for (JournalLine line : entry.getJournalLines()) {
                updateAccountBalance(line.getAccount(), line.getCredit(), line.getDebit());
            }

            journalEntryRepository.delete(entry);
            return new BaseResponse(HttpStatus.OK.value(), "Journal entry deleted successfully", null);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting journal entry: " + e.getMessage(), null);
        }
    }

    private void updateAccountBalance(Account account, BigDecimal debit, BigDecimal credit) {
        BigDecimal currentBalance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;

        Long assetTypeId = accountTypeRepository.findByName("ASSET").map(AccountType::getId).orElse(null);
        Long expenseTypeId = accountTypeRepository.findByName("EXPENSE").map(AccountType::getId).orElse(null);

        // For asset and expense accounts, debit increases balance
        // For liability and income accounts, credit increases balance
        if ((assetTypeId != null && account.getAccountTypeId().equals(assetTypeId)) ||
            (expenseTypeId != null && account.getAccountTypeId().equals(expenseTypeId))) {
            currentBalance = currentBalance.add(debit).subtract(credit);
        } else {
            currentBalance = currentBalance.add(credit).subtract(debit);
        }

        account.setBalance(currentBalance);
        accountRepository.save(account);
    }

    public BaseResponse getNextReference() {
        return new BaseResponse(HttpStatus.OK.value(), "Next journal reference generated",
                generateJournalReference());
    }

    private String generateJournalReference() {
        int year = Year.now().getValue();
        long count = journalEntryRepository.count() + 1;
        return "JE-" + year + "-" + String.format("%04d", count);
    }
}

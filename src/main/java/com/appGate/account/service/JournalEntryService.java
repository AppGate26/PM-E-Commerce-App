package com.appGate.account.service;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.JournalLineDto;
import com.appGate.account.models.Account;
import com.appGate.account.models.JournalEntry;
import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.AccountRepository;
import com.appGate.account.repository.JournalEntryRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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

            JournalEntry journalEntry = new JournalEntry();
            journalEntry.setJournalReference(generateJournalReference());
            journalEntry.setJournalType(dto.getJournalType());
            journalEntry.setTransactionDate(dto.getTransactionDate());
            journalEntry.setDescription(dto.getDescription());
            journalEntry.setPostedBy(userId);
            journalEntry.setIsApproved(false);

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

    public BaseResponse getAllJournalEntries() {
        List<JournalEntry> entries = journalEntryRepository.findAll();
        return new BaseResponse(HttpStatus.OK.value(), "Journal entries retrieved successfully", entries);
    }

    public BaseResponse getJournalEntryById(Long id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal entry not found"));
        return new BaseResponse(HttpStatus.OK.value(), "Journal entry retrieved successfully", entry);
    }

    public BaseResponse getJournalEntriesByDateRange(LocalDate startDate, LocalDate endDate) {
        List<JournalEntry> entries = journalEntryRepository.findByTransactionDateBetween(startDate, endDate);
        return new BaseResponse(HttpStatus.OK.value(), "Journal entries retrieved successfully", entries);
    }

    @Transactional
    public BaseResponse approveJournalEntry(Long id, Long approvedByUserId) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));

            entry.setIsApproved(true);
            entry.setApprovedBy(approvedByUserId);

            JournalEntry updatedEntry = journalEntryRepository.save(entry);
            return new BaseResponse(HttpStatus.OK.value(), "Journal entry approved successfully", updatedEntry);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error approving journal entry: " + e.getMessage(), null);
        }
    }

    @Transactional
    public BaseResponse deleteJournalEntry(Long id) {
        try {
            JournalEntry entry = journalEntryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Journal entry not found"));

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
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error deleting journal entry: " + e.getMessage(), null);
        }
    }

    private void updateAccountBalance(Account account, BigDecimal debit, BigDecimal credit) {
        BigDecimal currentBalance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;

        // For asset and expense accounts, debit increases balance
        // For liability and income accounts, credit increases balance
        if (account.getAccountType().name().equals("ASSET") || account.getAccountType().name().equals("EXPENSE")) {
            currentBalance = currentBalance.add(debit).subtract(credit);
        } else {
            currentBalance = currentBalance.add(credit).subtract(debit);
        }

        account.setBalance(currentBalance);
        accountRepository.save(account);
    }

    private String generateJournalReference() {
        int year = Year.now().getValue();
        long count = journalEntryRepository.count() + 1;
        return "JE-" + year + "-" + String.format("%04d", count);
    }
}

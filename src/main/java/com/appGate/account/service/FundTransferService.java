package com.appGate.account.service;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.FundTransferDto;
import com.appGate.account.dto.JournalLineDto;
import com.appGate.account.enums.JournalType;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FundTransferService {

    private final JournalEntryService journalEntryService;

    @Transactional
    public BaseResponse createFundTransfer(FundTransferDto dto, Long userId) {
        try {
            // Create journal entry for fund transfer
            CreateJournalEntryDto journalDto = new CreateJournalEntryDto();
            journalDto.setJournalType(JournalType.GENERAL_JOURNAL);
            journalDto.setTransactionDate(dto.getTransactionDate() != null ? dto.getTransactionDate() : LocalDate.now());
            journalDto.setDescription(dto.getDescription() != null ? dto.getDescription() : "Fund Transfer");

            List<JournalLineDto> lines = new ArrayList<>();

            // Debit line (from account)
            JournalLineDto debitLine = new JournalLineDto();
            debitLine.setAccountId(dto.getFromAccountId());
            debitLine.setDescription(dto.getDescription());
            debitLine.setDebit(null);
            debitLine.setCredit(dto.getAmount());
            debitLine.setUserId(dto.getCustomerId());
            debitLine.setReferenceNo(dto.getReferenceNo());
            lines.add(debitLine);

            // Credit line (to account)
            JournalLineDto creditLine = new JournalLineDto();
            creditLine.setAccountId(dto.getToAccountId());
            creditLine.setDescription(dto.getDescription());
            creditLine.setDebit(dto.getAmount());
            creditLine.setCredit(null);
            creditLine.setUserId(dto.getCustomerId());
            creditLine.setReferenceNo(dto.getReferenceNo());
            lines.add(creditLine);

            journalDto.setJournalLines(lines);

            return journalEntryService.createJournalEntry(journalDto, userId);
        } catch (Exception e) {
            e.printStackTrace();
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error creating fund transfer: " + e.getMessage(), null);
        }
    }
}

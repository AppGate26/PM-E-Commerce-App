package com.appGate.account.service;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.FundTransferDto;
import com.appGate.account.dto.FundWalletDto;
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
    private final WalletService walletService;

    @Transactional
    public BaseResponse createFundTransfer(FundTransferDto dto, Long userId) {
        try {
            // Primary flow (Accounting → Fund Transfers): move money from a company
            // account into a customer's wallet. Picking the customer is enough — the
            // wallet is resolved by customerId — so there is no per-customer GL to
            // choose. The company account being debited is recorded on the narration.
            if (dto.getCustomerId() != null && dto.getToAccountId() == null) {
                FundWalletDto fw = new FundWalletDto();
                fw.setCustomerId(dto.getCustomerId());
                fw.setAmount(dto.getAmount() != null ? dto.getAmount().doubleValue() : 0d);
                fw.setFundingMethod("TRANSFER");
                String companyRef = dto.getFromAccountId() != null
                        ? "Company account " + dto.getFromAccountId()
                        : "Company account";
                String base = (dto.getDescription() != null && !dto.getDescription().isBlank())
                        ? dto.getDescription()
                        : "Fund transfer to customer wallet";
                fw.setDescription(base + " (" + companyRef + ")");
                return walletService.fundCustomerWallet(fw);
            }

            // Legacy GL-to-GL transfer (both accounts supplied): keep the double entry.
            CreateJournalEntryDto journalDto = new CreateJournalEntryDto();
            journalDto.setJournalType(JournalType.GENERAL_JOURNAL);
            journalDto.setTransactionDate(dto.getTransactionDate() != null ? dto.getTransactionDate() : LocalDate.now());
            journalDto.setDescription(dto.getDescription() != null ? dto.getDescription() : "Fund Transfer");

            List<JournalLineDto> lines = new ArrayList<>();

            // Money moves FROM the source (e.g. customer wallet) TO the destination
            // (e.g. settlement): debit the source, credit the destination. This was
            // previously inverted (source credited / destination debited), which sent the
            // funds the wrong way relative to the on-screen "From → To" direction.
            JournalLineDto debitLine = new JournalLineDto();
            debitLine.setAccountId(dto.getFromAccountId());
            debitLine.setDescription(dto.getDescription());
            debitLine.setDebit(dto.getAmount());
            debitLine.setCredit(null);
            debitLine.setUserId(dto.getCustomerId());
            debitLine.setReferenceNo(dto.getReferenceNo());
            lines.add(debitLine);

            // Credit line (to / settlement account)
            JournalLineDto creditLine = new JournalLineDto();
            creditLine.setAccountId(dto.getToAccountId());
            creditLine.setDescription(dto.getDescription());
            creditLine.setDebit(null);
            creditLine.setCredit(dto.getAmount());
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

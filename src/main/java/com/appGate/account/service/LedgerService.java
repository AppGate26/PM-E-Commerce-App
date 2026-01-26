package com.appGate.account.service;

import com.appGate.account.models.JournalLine;
import com.appGate.account.repository.JournalLineRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final JournalLineRepository journalLineRepository;

    public BaseResponse getGeneralLedger(LocalDate startDate, LocalDate endDate, String referenceNo) {
        try {
            List<JournalLine> lines = journalLineRepository.findByDateRange(startDate, endDate);

            // Filter by reference number if provided
            if (referenceNo != null && !referenceNo.isEmpty()) {
                lines = lines.stream()
                        .filter(line -> referenceNo.equals(line.getReferenceNo()))
                        .toList();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("transactions", lines);
            response.put("totalDebit", lines.stream()
                    .map(JournalLine::getDebit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            response.put("totalCredit", lines.stream()
                    .map(JournalLine::getCredit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));

            return new BaseResponse(HttpStatus.OK.value(), "General ledger retrieved successfully", response);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving general ledger: " + e.getMessage(), null);
        }
    }

    public BaseResponse getAccountLedger(Long accountId, LocalDate startDate, LocalDate endDate) {
        try {
            List<JournalLine> lines = journalLineRepository.findByAccountAndDateRange(accountId, startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("transactions", lines);
            response.put("totalDebit", lines.stream()
                    .map(JournalLine::getDebit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            response.put("totalCredit", lines.stream()
                    .map(JournalLine::getCredit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));

            return new BaseResponse(HttpStatus.OK.value(), "Account ledger retrieved successfully", response);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving account ledger: " + e.getMessage(), null);
        }
    }

    public BaseResponse getCustomerLedger(Long userId, LocalDate startDate, LocalDate endDate) {
        try {
            List<JournalLine> lines = journalLineRepository.findByUserAndDateRange(userId, startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("transactions", lines);
            response.put("totalDebit", lines.stream()
                    .map(JournalLine::getDebit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            response.put("totalCredit", lines.stream()
                    .map(JournalLine::getCredit)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));

            return new BaseResponse(HttpStatus.OK.value(), "Customer ledger retrieved successfully", response);
        } catch (Exception e) {
            return new BaseResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    "Error retrieving customer ledger: " + e.getMessage(), null);
        }
    }
}

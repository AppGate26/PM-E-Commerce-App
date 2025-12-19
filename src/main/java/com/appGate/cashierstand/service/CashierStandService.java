package com.appGate.cashierstand.service;

import com.appGate.cashierstand.dto.*;
import com.appGate.cashierstand.enums.*;
import com.appGate.cashierstand.models.*;
import com.appGate.cashierstand.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CashierStandService {

    private final CashPaymentRepository cashPaymentRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final CustomerLedgerRepository customerLedgerRepository;
    private final DepositTransactionRepository depositTransactionRepository;

    // ==================== CASH PAYMENT ====================

    @Transactional
    public CashPayment processCashPayment(CashPaymentDto dto) {
        CashPayment payment = new CashPayment();
        payment.setReferenceNumber(dto.getReferenceNumber() != null ?
                dto.getReferenceNumber() : generateReferenceNumber());
        payment.setCustomerName(dto.getCustomerName());
        payment.setAddress(dto.getAddress());
        payment.setPhoneNumber(dto.getPhoneNumber());
        payment.setPaymentMethod(PaymentMethod.valueOf(dto.getPaymentMethod()));
        payment.setEnteredBy(dto.getEnteredBy());
        payment.setTransactionDate(LocalDateTime.now());

        BigDecimal total = BigDecimal.ZERO;

        if (dto.getProducts() != null) {
            for (PaymentItemDto itemDto : dto.getProducts()) {
                CashPaymentItem item = new CashPaymentItem();
                item.setCashPayment(payment);
                item.setProductName(itemDto.getProductName());
                item.setDescription(itemDto.getDescription());
                item.setCategory(itemDto.getCategory());
                item.setUnitPrice(itemDto.getUnitPrice());
                item.setQuantity(itemDto.getQuantity());

                BigDecimal lineTotal = itemDto.getUnitPrice()
                        .multiply(BigDecimal.valueOf(itemDto.getQuantity()));
                item.setLineTotal(lineTotal);
                total = total.add(lineTotal);

                payment.getItems().add(item);
            }
        }

        payment.setTotalBalance(total);
        return cashPaymentRepository.save(payment);
    }

    public CashPayment getCashPayment(Long paymentId) {
        return cashPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Cash payment not found"));
    }

    private String generateReferenceNumber() {
        return "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== LOAN PAYMENT ====================

    public Map<String, Object> searchCustomerByAccount(String accountNumber) {
        // This would typically query from Customer table
        // For now, returning mock data structure
        Map<String, Object> result = new HashMap<>();
        result.put("accountNumber", accountNumber);
        result.put("accountName", "Customer Name");
        result.put("bvn", "22123456789");
        result.put("loanBalance", 150000);
        result.put("acquiredInterest", 5000);
        result.put("principalLoanBalance", 145000);
        return result;
    }

    @Transactional
    public LoanPayment processLoanPayment(LoanPaymentDto dto) {
        LoanPayment payment = new LoanPayment();
        payment.setTransactionId(generateTransactionId());
        payment.setAccountNumber(dto.getAccountNumber());
        payment.setAmountPaid(dto.getAmountToPay());
        payment.setPaymentMode(PaymentMethod.valueOf(dto.getPaymentMode()));
        payment.setEnteredBy(dto.getEnteredBy());
        payment.setDescription(dto.getDescription());
        payment.setTransactionDate(LocalDateTime.now());

        // Set balances (would be calculated from actual customer loan data)
        payment.setPreviousBalance(BigDecimal.valueOf(150000));
        payment.setNewBalance(payment.getPreviousBalance().subtract(dto.getAmountToPay()));

        LoanPayment saved = loanPaymentRepository.save(payment);

        // Add to customer ledger
        addToLedger(dto.getAccountNumber(), "Loan Payment", saved.getTransactionId(),
                BigDecimal.ZERO, dto.getAmountToPay());

        return saved;
    }

    private String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== BALANCE ENQUIRY ====================

    public Map<String, Object> getBalanceEnquiry(String accountName) {
        List<CustomerLedger> ledgers = customerLedgerRepository
                .findByAccountNameContainingIgnoreCase(accountName);

        Map<String, Object> result = new HashMap<>();
        if (!ledgers.isEmpty()) {
            CustomerLedger latest = ledgers.get(ledgers.size() - 1);
            result.put("accountName", latest.getAccountName());
            result.put("balance", latest.getBalance());
        }
        result.put("bvn", "22123456789");
        result.put("customerName", accountName);
        result.put("loanAccruedInterest", 5000);
        result.put("interestBalance", 2000);
        result.put("principalLoanBalance", 145000);

        return result;
    }

    // ==================== CUSTOMER LEDGER ====================

    public Map<String, Object> getCustomerLedger(Long customerId, LocalDate startDate, LocalDate endDate) {
        Pageable pageable = PageRequest.of(0, 1000, Sort.by("transactionDate").ascending());
        Page<CustomerLedger> ledgers = customerLedgerRepository
                .findByCustomerIdAndTransactionDateBetween(customerId, startDate, endDate, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("dateRange", Map.of("from", startDate, "to", endDate));
        result.put("transactions", ledgers.getContent());

        return result;
    }

    private void addToLedger(String accountNumber, String details, String refNo,
            BigDecimal debit, BigDecimal credit) {
        CustomerLedger ledger = new CustomerLedger();
        ledger.setAccountNumber(accountNumber);
        ledger.setTransactionDate(LocalDate.now());
        ledger.setTransactionDetails(details);
        ledger.setRefNo(refNo);
        ledger.setDebitAmount(debit);
        ledger.setCreditAmount(credit);
        customerLedgerRepository.save(ledger);
    }

    // ==================== CALL OVER ====================

    public Map<String, Object> getCallOver(String cashier, LocalDate startDate, LocalDate endDate) {
        List<DepositTransaction> transactions = depositTransactionRepository
                .findByCashierAndTransactionDateBetween(cashier, startDate, endDate);

        BigDecimal total = depositTransactionRepository
                .sumAmountByCashierAndDateRange(cashier, startDate, endDate);

        Map<String, Object> result = new HashMap<>();
        result.put("totalBalance", total != null ? total : BigDecimal.ZERO);
        result.put("transactions", transactions);

        return result;
    }

    // ==================== REPORTS ====================

    public Map<String, Object> getAllDepositsReport(LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<DepositTransaction> deposits = depositTransactionRepository
                .findByTransactionDateBetween(startDate, endDate, pageable);

        return buildReport("ALL DEPOSIT REPORT", deposits);
    }

    public Map<String, Object> getCashDepositsReport(LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<DepositTransaction> deposits = depositTransactionRepository
                .findByTransactionTypeAndTransactionDateBetween(
                        TransactionType.CASH_PAYMENT, startDate, endDate, pageable);

        return buildReport("CASH DEPOSIT REPORT", deposits);
    }

    public Map<String, Object> getBankDepositsReport(String bank, LocalDate startDate,
            LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());

        Page<DepositTransaction> deposits;
        if (bank != null && !bank.isEmpty()) {
            BankName bankName = BankName.valueOf(bank.toUpperCase().replace(" ", "_"));
            deposits = depositTransactionRepository
                    .findByBankNameAndTransactionDateBetween(bankName, startDate, endDate, pageable);
        } else {
            deposits = depositTransactionRepository
                    .findByTransactionTypeAndTransactionDateBetween(
                            TransactionType.BANK_TRANSFER, startDate, endDate, pageable);
        }

        return buildReport("BANK DEPOSIT REPORT", deposits);
    }

    private Map<String, Object> buildReport(String title, Page<DepositTransaction> deposits) {
        BigDecimal total = deposits.getContent().stream()
                .map(DepositTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new HashMap<>();
        report.put("companyName", "PEACE OF MIND ELECTRONICS");
        report.put("address", "64 OGUI ROAD, ENUGU-STATE");
        report.put("tel", "080XXXXXX");
        report.put("reportTitle", title);
        report.put("transactions", deposits.getContent());
        report.put("total", total);

        return report;
    }
}

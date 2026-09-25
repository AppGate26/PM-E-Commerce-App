package com.appGate.cashierstand.service;

import com.appGate.cashierstand.dto.*;
import com.appGate.cashierstand.enums.*;
import com.appGate.cashierstand.models.*;
import com.appGate.cashierstand.repository.*;
import com.appGate.account.models.Payment;
import com.appGate.account.enums.PaymentStatus;
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
import java.util.Comparator;
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
    private final CashierTillBalanceRepository cashierTillBalanceRepository;
    private final com.appGate.account.repository.WalletRepository walletRepository;
    private final com.appGate.client.repository.CustomerRepository customerRepository;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final com.appGate.account.service.PaymentGatewayService paymentGatewayService;
    private final com.appGate.orderingsales.repository.SalesOrderRepository salesOrderRepository;
    private final com.appGate.account.repository.PaymentRepository paymentRepository;

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
        payment.setTillBox(normalizeTillBox(dto.getTillBox()));
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

        // A repeat save of the same reference is the same payment, not a second one. The
        // screen tells the operator to "save again" when the id doesn't come back, which
        // created a duplicate CashPayment and inflated the till by the amount twice.
        CashPayment existing = payment.getReferenceNumber() != null
                ? cashPaymentRepository.findByReferenceNumber(payment.getReferenceNumber()).orElse(null)
                : null;
        if (existing != null) {
            return existing;
        }

        CashPayment saved = cashPaymentRepository.save(payment);

        // Keep the cashier's running till total in the DB (server-authoritative).
        if (payment.getPaymentMethod() == PaymentMethod.CASH
                && payment.getEnteredBy() != null
                && total.compareTo(BigDecimal.ZERO) > 0) {
            adjustTillBalance(payment.getEnteredBy(), payment.getTillBox(), total);
        }

        // Record the deposit so it reaches the cashier reports and the call-over, which
        // read deposit_transactions. Nothing in the system ever wrote that table, so every
        // one of those screens was permanently empty.
        recordDepositTransaction(saved, total);

        return saved;
    }

    /** Mirrors a collected cash payment into deposit_transactions for the cashier reports. */
    private void recordDepositTransaction(CashPayment payment, BigDecimal total) {
        try {
            if (total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }
            DepositTransaction deposit = new DepositTransaction();
            deposit.setTransactionId(payment.getReferenceNumber());
            deposit.setCustomerName(payment.getCustomerName());
            deposit.setTransactionDate(LocalDate.now());
            deposit.setDescription("Cash payment collected at the counter");
            deposit.setAmount(total);
            deposit.setTransactionType(payment.getPaymentMethod() == PaymentMethod.CASH
                    ? com.appGate.cashierstand.enums.TransactionType.CASH_PAYMENT
                    : com.appGate.cashierstand.enums.TransactionType.BANK_TRANSFER);
            deposit.setCashier(payment.getEnteredBy());
            depositTransactionRepository.save(deposit);
        } catch (Exception e) {
            System.err.println("Could not record deposit transaction for payment "
                    + payment.getReferenceNumber() + ": " + e.getMessage());
        }
    }

    public CashPayment getCashPayment(Long paymentId) {
        CashPayment payment = cashPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Cash payment not found"));
        branchScopeService.assertCanAccess(payment.getBranchId());
        return payment;
    }

    private String generateReferenceNumber() {
        return "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== TILL BALANCES ====================

    private String normalizeTillBox(String tillBox) {
        if (tillBox == null || tillBox.trim().isEmpty()) {
            return "MAIN";
        }
        return tillBox.trim().toUpperCase();
    }

    private void adjustTillBalance(String cashier, String tillBox, BigDecimal amount) {
        String till = normalizeTillBox(tillBox);
        Long branchId = branchScopeService.getScopedBranchId();

        // The till is keyed by cashier + box + branch: the same cashier working two
        // branches must not pool their cash into one balance.
        CashierTillBalance balance = (branchId == null
                ? cashierTillBalanceRepository.findByCashierAndTillBox(cashier, till)
                : cashierTillBalanceRepository.findByCashierAndTillBoxAndBranchId(cashier, till, branchId))
                .orElseGet(() -> {
                    CashierTillBalance created = new CashierTillBalance();
                    created.setCashier(cashier);
                    created.setTillBox(till);
                    created.setBranchId(branchId);
                    created.setBalance(BigDecimal.ZERO);
                    return created;
                });
        balance.setBalance(balance.getBalance().add(amount));
        cashierTillBalanceRepository.save(balance);
    }

    public Map<String, Object> getTillBalances(String cashier) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<CashierTillBalance> rows = branchId == null
                ? cashierTillBalanceRepository.findByCashier(cashier)
                : cashierTillBalanceRepository.findByCashierAndBranchId(cashier, branchId);

        Map<String, Object> balances = new HashMap<>();
        for (CashierTillBalance row : rows) {
            balances.put(row.getTillBox(), row.getBalance());
        }
        return balances;
    }

    // ==================== LOAN PAYMENT ====================

    public Map<String, Object> searchCustomerByAccount(String accountNumber) {
        Map<String, Object> result = new HashMap<>();
        result.put("accountNumber", accountNumber);

        // Resolve the real walk-in customer and their wallet by account number so the cashier
        // can locate the account to fund (previously this returned hard-coded mock data).
        // account_number is not guaranteed unique (some walk-ins share a reused phone
        // number), so take the most recently created match instead of a single-result lookup.
        java.util.List<com.appGate.client.models.Customer> accountMatches =
                customerRepository.findAllByAccountNumberOrderByIdDesc(accountNumber);
        com.appGate.client.models.Customer customer =
                accountMatches.isEmpty() ? null : accountMatches.get(0);

        // The cashier's search box accepts a name OR an account number. When the value is
        // not an exact account number, fall back to a name lookup so the customer info
        // still shows instead of "Unknown customer" (Cashier #1).
        if (customer == null) {
            java.util.List<com.appGate.client.models.Customer> byName =
                    customerRepository.findByFirstNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(
                            accountNumber, accountNumber);
            if (!byName.isEmpty()) {
                customer = byName.get(0);
            }
        }

        com.appGate.account.models.Wallet wallet =
                walletRepository.findByAccountNumber(accountNumber).orElse(null);
        if (wallet == null && customer != null) {
            wallet = walletRepository.findByCustomerId(customer.getId()).orElse(null);
        }

        // Echo back the resolved account number (the search term may have been a name).
        if (customer != null && customer.getAccountNumber() != null
                && !customer.getAccountNumber().isBlank()) {
            result.put("accountNumber", customer.getAccountNumber());
        }

        String accountName = customer != null
                ? ((customer.getFirstName() != null ? customer.getFirstName() : "") + " "
                        + (customer.getSurname() != null ? customer.getSurname() : "")).trim()
                : "";

        Long customerId = customer != null ? customer.getId()
                : (wallet != null ? wallet.getCustomerId() : null);
        Double balance = wallet != null && wallet.getBalance() != null ? wallet.getBalance() : 0.0;

        result.put("accountName", accountName.isBlank() ? "Unknown customer" : accountName);
        result.put("customerId", customerId);
        result.put("walletBalance", balance);
        result.put("balance", balance);
        result.put("phoneNumber", customer != null ? customer.getPhoneNumber() : null);
        result.put("email", customer != null ? customer.getEmail() : null);
        result.put("bvn", customer != null ? customer.getBvn() : null);
        result.put("found", customer != null || wallet != null);
        return result;
    }

    @Transactional
    /**
     * @deprecated Unreachable: its endpoint was removed. It fabricates the balances below
     *     and reduces no actual loan, so it must not be wired back up as-is. A real
     *     implementation has to resolve the customer's LoanDetails/LoanRepaymentEntry rows
     *     and settle against them, the way SalesService.verifyOrderInstallmentPayment does.
     */
    @Deprecated
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
        Long branchId = branchScopeService.getScopedBranchId();
        List<CustomerLedger> ledgers = branchId == null
                ? customerLedgerRepository.findByAccountNameContainingIgnoreCase(accountName)
                : customerLedgerRepository
                        .findByAccountNameContainingIgnoreCaseAndBranchIdIncludingUnassigned(accountName, branchId);

        CustomerLedger latestLedger = ledgers.isEmpty() ? null : ledgers.get(ledgers.size() - 1);

        // A customer with no ledger entries yet (never had a cash/loan
        // transaction) would otherwise never resolve here, so also try the
        // customer record itself -- same lookup searchCustomerByAccount uses.
        com.appGate.client.models.Customer customer = null;
        if (latestLedger != null && latestLedger.getCustomerId() != null) {
            customer = customerRepository.findById(latestLedger.getCustomerId()).orElse(null);
        }
        if (customer == null) {
            List<com.appGate.client.models.Customer> byAccount =
                    customerRepository.findAllByAccountNumberOrderByIdDesc(accountName);
            if (!byAccount.isEmpty()) {
                customer = byAccount.get(0);
            }
        }
        if (customer == null) {
            List<com.appGate.client.models.Customer> byName = customerRepository
                    .findByFirstNameContainingIgnoreCaseOrSurnameContainingIgnoreCase(accountName, accountName);
            if (!byName.isEmpty()) {
                customer = byName.get(0);
            }
        }

        Map<String, Object> result = new HashMap<>();
        if (latestLedger != null) {
            result.put("balance", latestLedger.getBalance());
        }

        // Only report a name/account/id/bvn when a real customer or ledger row
        // was actually found. This used to always echo back hard-coded
        // placeholder values (bvn, loan figures) even for a nonexistent
        // account, which made the ledger screen look like a match had been
        // found for any garbage input.
        if (customer != null) {
            String resolvedName = ((customer.getFirstName() != null ? customer.getFirstName() : "") + " "
                    + (customer.getSurname() != null ? customer.getSurname() : "")).trim();
            result.put("customerId", customer.getId());
            result.put("accountNumber", customer.getAccountNumber());
            result.put("accountName", resolvedName.isBlank() ? accountName : resolvedName);
            result.put("customerName", resolvedName.isBlank() ? accountName : resolvedName);
            result.put("bvn", customer.getBvn());
        } else if (latestLedger != null) {
            result.put("customerId", latestLedger.getCustomerId());
            result.put("accountNumber", latestLedger.getAccountNumber());
            result.put("accountName", latestLedger.getAccountName());
            result.put("customerName", latestLedger.getAccountName());
        }

        return result;
    }

    // ==================== CUSTOMER LEDGER ====================

    public Map<String, Object> getCustomerLedger(Long customerId, LocalDate startDate, LocalDate endDate) {
        Long branchId = branchScopeService.getScopedBranchId();
        List<CustomerLedger> manualEntries;
        if (startDate != null && endDate != null) {
            Pageable pageable = PageRequest.of(0, 1000, Sort.by("transactionDate").ascending());
            manualEntries = (branchId == null
                    ? customerLedgerRepository
                            .findByCustomerIdAndTransactionDateBetween(customerId, startDate, endDate, pageable)
                    : customerLedgerRepository
                            .findByCustomerIdAndBranchIdIncludingUnassignedAndTransactionDateBetween(
                                    customerId, branchId, startDate, endDate, pageable))
                    .getContent();
        } else {
            manualEntries = branchId == null
                    ? customerLedgerRepository.findByCustomerId(customerId)
                    : customerLedgerRepository.findByCustomerIdAndBranchIdIncludingUnassigned(customerId, branchId);
        }

        // The CustomerLedger table above is only ever written to by a cashier-recorded
        // "Loan Payment" (see processLoanPayment/addToLedger) - it never sees a customer's
        // actual credit sales or installment payments, which live in SalesOrder/Payment
        // instead. Without folding those in, this ledger is empty for the overwhelming
        // majority of customers even though they have real activity. Reconstruct each
        // credit sale as a debit and each completed payment against it as a credit, and
        // merge with the manual entries above into one chronological, running-balance list.
        List<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (CustomerLedger entry : manualEntries) {
            rows.add(ledgerRow(entry.getId(), entry.getTransactionDate(), entry.getTransactionDetails(),
                    entry.getRefNo(), entry.getDebitAmount(), entry.getCreditAmount()));
        }

        List<com.appGate.orderingsales.models.SalesOrder> creditOrders = salesOrderRepository
                .findByCustomerId(customerId, PageRequest.of(0, 1000)).getContent().stream()
                .filter(o -> o.getOrderType() == com.appGate.orderingsales.enums.SalesOrderType.CREDIT
                        || o.getOrderType() == com.appGate.orderingsales.enums.SalesOrderType.INSTALLMENT)
                .filter(o -> !Boolean.TRUE.equals(o.getIsRefunded()))
                .filter(o -> o.getStatus() != com.appGate.orderingsales.enums.OrderStatus.CANCELLED
                        && o.getStatus() != com.appGate.orderingsales.enums.OrderStatus.FAILED)
                // Same branch scope as the manual entries above: a scoped user only sees
                // orders for their own branch (unassigned/null-branch orders included).
                .filter(o -> branchId == null || o.getBranchId() == null || branchId.equals(o.getBranchId()))
                .toList();

        Map<Long, String> orderRefById = new HashMap<>();
        // Mobile-mirrored orders (mobileOrderId != null) receive their installment
        // payments as Payment rows keyed by the mobile Order id (payment.orderId), not
        // this SalesOrder's own id (payment.salesOrderId) - see Payment's javadoc on
        // those two columns. Track that mapping too so those payments are picked up
        // below instead of only ever matching walk-in-style salesOrderId payments.
        Map<Long, String> orderRefByMobileOrderId = new HashMap<>();
        for (com.appGate.orderingsales.models.SalesOrder order : creditOrders) {
            LocalDate date = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now();
            if (startDate != null && (date.isBefore(startDate) || date.isAfter(endDate))) continue;
            orderRefById.put(order.getId(), order.getSalesReference());
            if (order.getMobileOrderId() != null) {
                orderRefByMobileOrderId.put(order.getMobileOrderId(), order.getSalesReference());
            }
            rows.add(ledgerRow(null, date, "Credit Sale - Order " + order.getSalesReference(),
                    order.getSalesReference(),
                    order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO, BigDecimal.ZERO));
        }

        // Only payments actually tied to one of this customer's credit/installment
        // orders above count as ledger credits - findByUserIdAndStatus alone also
        // returns one-off/cash-order payments and orderless direct payments, which
        // have nothing to do with credit recovered and were corrupting the running
        // balance (see CLIENT #1 tally investigation).
        List<Payment> payments = paymentRepository.findByUserIdAndStatus(customerId, PaymentStatus.COMPLETED).stream()
                .filter(p -> (p.getSalesOrderId() != null && orderRefById.containsKey(p.getSalesOrderId()))
                        || (p.getOrderId() != null && orderRefByMobileOrderId.containsKey(p.getOrderId())))
                .filter(p -> branchId == null || p.getBranchId() == null || branchId.equals(p.getBranchId()))
                .toList();
        for (Payment payment : payments) {
            LocalDate date = (payment.getPaidAt() != null ? payment.getPaidAt()
                    : payment.getCreatedAt() != null ? payment.getCreatedAt() : LocalDateTime.now()).toLocalDate();
            if (startDate != null && (date.isBefore(startDate) || date.isAfter(endDate))) continue;
            String orderRef = payment.getSalesOrderId() != null ? orderRefById.get(payment.getSalesOrderId())
                    : orderRefByMobileOrderId.get(payment.getOrderId());
            String details = orderRef != null ? "Payment - Order " + orderRef : "Payment";
            rows.add(ledgerRow(null, date, details, payment.getPaymentReference(),
                    BigDecimal.ZERO, BigDecimal.valueOf(payment.getAmount() != null ? payment.getAmount() : 0.0)));
        }

        rows.sort(Comparator.comparing(r -> (LocalDate) r.get("transactionDate")));

        BigDecimal running = BigDecimal.ZERO;
        for (Map<String, Object> row : rows) {
            BigDecimal credit = (BigDecimal) row.get("creditAmount");
            BigDecimal debit = (BigDecimal) row.get("debitAmount");
            running = running.add(credit).subtract(debit);
            row.put("balance", running);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("dateRange", startDate != null ? Map.of("from", startDate, "to", endDate) : null);
        result.put("transactions", rows);

        return result;
    }

    private Map<String, Object> ledgerRow(Long id, LocalDate date, String details, String refNo,
            BigDecimal debit, BigDecimal credit) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", id);
        row.put("transactionDate", date);
        row.put("transactionDetails", details);
        row.put("refNo", refNo);
        row.put("debitAmount", debit != null ? debit : BigDecimal.ZERO);
        row.put("creditAmount", credit != null ? credit : BigDecimal.ZERO);
        return row;
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

        // Resolve the customer so the ledger is keyed by customerId (getCustomerLedger reads by
        // customerId, not accountNumber) and carries a display name.
        java.util.List<com.appGate.client.models.Customer> ledgerAccountMatches =
                customerRepository.findAllByAccountNumberOrderByIdDesc(accountNumber);
        com.appGate.client.models.Customer customer =
                ledgerAccountMatches.isEmpty() ? null : ledgerAccountMatches.get(0);
        if (customer != null) {
            ledger.setCustomerId(customer.getId());
            String accountName = ((customer.getFirstName() != null ? customer.getFirstName() : "") + " "
                    + (customer.getSurname() != null ? customer.getSurname() : "")).trim();
            ledger.setAccountName(accountName.isBlank() ? null : accountName);
        }

        // Running balance: previous balance + credit - debit (credits increase the customer's
        // account balance, debits reduce it).
        BigDecimal previousBalance = BigDecimal.ZERO;
        if (customer != null) {
            CustomerLedger last = customerLedgerRepository
                    .findFirstByCustomerIdOrderByIdDesc(customer.getId());
            if (last != null && last.getBalance() != null) {
                previousBalance = last.getBalance();
            }
        }
        BigDecimal safeCredit = credit != null ? credit : BigDecimal.ZERO;
        BigDecimal safeDebit = debit != null ? debit : BigDecimal.ZERO;
        ledger.setBalance(previousBalance.add(safeCredit).subtract(safeDebit));

        customerLedgerRepository.save(ledger);
    }

    // ==================== CALL OVER ====================

    public Map<String, Object> getCallOver(String cashier, LocalDate startDate, LocalDate endDate) {
        Long branchId = branchScopeService.getScopedBranchId();

        List<DepositTransaction> transactions = branchId == null
                ? depositTransactionRepository
                        .findByCashierAndTransactionDateBetween(cashier, startDate, endDate)
                : depositTransactionRepository
                        .findByBranchIdAndCashierAndTransactionDateBetween(
                                branchId, cashier, startDate, endDate);

        BigDecimal total = branchId == null
                ? depositTransactionRepository
                        .sumAmountByCashierAndDateRange(cashier, startDate, endDate)
                : depositTransactionRepository
                        .sumAmountByCashierAndBranchAndDateRange(cashier, branchId, startDate, endDate);

        Map<String, Object> result = new HashMap<>();
        result.put("totalBalance", total != null ? total : BigDecimal.ZERO);
        result.put("transactions", transactions);

        return result;
    }

    // ==================== REPORTS ====================

    public Map<String, Object> getAllDepositsReport(LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Long branchId = branchScopeService.getScopedBranchId();

        Page<DepositTransaction> deposits = branchId == null
                ? depositTransactionRepository
                        .findByTransactionDateBetween(startDate, endDate, pageable)
                : depositTransactionRepository
                        .findByBranchIdAndTransactionDateBetween(branchId, startDate, endDate, pageable);

        return buildReport("ALL DEPOSIT REPORT", deposits);
    }

    public Map<String, Object> getCashDepositsReport(LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Long branchId = branchScopeService.getScopedBranchId();

        Page<DepositTransaction> deposits = branchId == null
                ? depositTransactionRepository.findByTransactionTypeAndTransactionDateBetween(
                        TransactionType.CASH_PAYMENT, startDate, endDate, pageable)
                : depositTransactionRepository.findByBranchIdAndTransactionTypeAndTransactionDateBetween(
                        branchId, TransactionType.CASH_PAYMENT, startDate, endDate, pageable);

        return buildReport("CASH DEPOSIT REPORT", deposits);
    }

    public Map<String, Object> getBankDepositsReport(String bank, LocalDate startDate,
            LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Long branchId = branchScopeService.getScopedBranchId();

        Page<DepositTransaction> deposits;
        if (bank != null && !bank.isEmpty()) {
            BankName bankName = BankName.valueOf(bank.toUpperCase().replace(" ", "_"));
            deposits = branchId == null
                    ? depositTransactionRepository.findByBankNameAndTransactionDateBetween(
                            bankName, startDate, endDate, pageable)
                    : depositTransactionRepository.findByBranchIdAndBankNameAndTransactionDateBetween(
                            branchId, bankName, startDate, endDate, pageable);
        } else {
            deposits = branchId == null
                    ? depositTransactionRepository.findByTransactionTypeAndTransactionDateBetween(
                            TransactionType.BANK_TRANSFER, startDate, endDate, pageable)
                    : depositTransactionRepository.findByBranchIdAndTransactionTypeAndTransactionDateBetween(
                            branchId, TransactionType.BANK_TRANSFER, startDate, endDate, pageable);
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

    // ==================== CUSTOMER DIRECTORY ====================

    public List<Map<String, Object>> getCustomerDirectory() {
        Long branchId = branchScopeService.getScopedBranchId();
        List<com.appGate.client.models.Customer> customers = branchId == null
                ? customerRepository.findAll()
                : customerRepository.findByBranchIdIncludingUnassigned(branchId);

        return customers.stream().map(customer -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", customer.getId());
            dto.put("accountNumber", customer.getAccountNumber());
            dto.put("accountNo", customer.getAccountNumber());
            dto.put("customerName", (customer.getFirstName() != null ? customer.getFirstName() : "") + " "
                    + (customer.getSurname() != null ? customer.getSurname() : ""));
            dto.put("name", dto.get("customerName"));
            dto.put("email", customer.getEmail());
            dto.put("phoneNumber", customer.getPhoneNumber());
            dto.put("customerType", customer.getCustomerType());
            return dto;
        }).toList();
    }

    // ==================== PAYSTACK CHECKOUT ====================

    public Map<String, Object> initializePaystackCheckout(Map<String, Object> payload) {
        com.appGate.account.dto.InitializeCashierTransferDto dto =
                new com.appGate.account.dto.InitializeCashierTransferDto();
        dto.setAccountNumber((String) payload.get("accountNumber"));
        dto.setCustomerName((String) payload.get("customerName"));
        Object amount = payload.get("amount");
        dto.setAmount(amount instanceof Number ? ((Number) amount).doubleValue() : null);
        dto.setEmail((String) payload.get("email"));
        dto.setEnteredBy((String) payload.get("enteredBy"));
        dto.setDescription((String) payload.get("description"));
        dto.setCallbackUrl((String) payload.get("callbackUrl"));
        dto.setPaymentChannel((String) payload.get("paymentChannel"));
        Object customerId = payload.get("customerId");
        if (customerId instanceof Number) {
            dto.setCustomerId(((Number) customerId).longValue());
        }

        // Delegates to the real Paystack integration (no channel restriction, so the
        // hosted checkout lets the customer pick card or bank transfer either way).
        com.appGate.account.response.BaseResponse response =
                paymentGatewayService.initializeCashierBankTransfer(dto);

        Map<String, Object> result = new HashMap<>();
        result.put("message", response.getMessage());
        if (response.getStatus() == 200 && response.getData() instanceof Map) {
            Map<?, ?> data = (Map<?, ?>) response.getData();
            Object authorizationUrl = data.get("authorizationUrl");
            result.put("reference", data.get("paymentReference"));
            result.put("authorizationUrl", authorizationUrl);
            result.put("checkout_url", authorizationUrl);
            result.put("accessCode", data.get("accessCode"));
        }
        result.put("accountNumber", dto.getAccountNumber());
        result.put("customerName", dto.getCustomerName());
        result.put("amount", dto.getAmount());
        result.put("email", dto.getEmail());
        result.put("paymentChannel", payload.get("paymentChannel"));

        return result;
    }
}

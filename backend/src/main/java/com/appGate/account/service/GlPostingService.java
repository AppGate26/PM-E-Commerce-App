package com.appGate.account.service;

import com.appGate.account.dto.CreateJournalEntryDto;
import com.appGate.account.dto.JournalLineDto;
import com.appGate.account.enums.GlPurpose;
import com.appGate.account.enums.JournalType;
import com.appGate.account.models.Account;
import com.appGate.account.models.AccountDetails;
import com.appGate.account.repository.AccountDetailsRepository;
import com.appGate.account.repository.AccountRepository;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Posts customer payments to the general ledger automatically.
 *
 * <p>Accounts are resolved by (branch, {@link GlPurpose}) from the Account Details
 * set up on the Account Details page:
 * <ul>
 *   <li><b>Paystack sale</b> — Dr branch PAYSTACK, Cr branch SALES_REVENUE.
 *   <li><b>Wallet funding</b> — Dr Head Office PAYSTACK, Cr Head Office CUSTOMER_WALLET.
 *   <li><b>Wallet purchase</b> — Dr Head Office CUSTOMER_WALLET, Cr branch SALES_REVENUE.
 * </ul>
 *
 * <p>Postings are <b>fail-soft</b>: a missing GL or posting error is logged and never
 * breaks the payment itself. They are <b>idempotent</b>: the journal reference is derived
 * from the payment reference, so a replayed webhook or repeated verify posts once.
 * They run <b>after the caller's transaction commits</b>, so a payment that rolls back
 * never leaves a journal behind.
 */
@Service
@RequiredArgsConstructor
public class GlPostingService {

    private static final Logger log = LoggerFactory.getLogger(GlPostingService.class);

    private final AccountDetailsRepository accountDetailsRepository;
    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;
    private final JournalEntryService journalEntryService;

    /** A product bought through Paystack: Dr branch Paystack GL, Cr branch Sales GL. */
    public void postPaystackSale(Long branchId, Double amount, String paymentReference, Long customerUserId) {
        afterCommit(() -> {
            Long branch = branchId != null ? branchId : headOfficeBranchId();
            post("GL-SALE-" + paymentReference, branch, amount,
                    branch, GlPurpose.PAYSTACK,
                    branch, GlPurpose.SALES_REVENUE,
                    "Paystack sale " + paymentReference, paymentReference, customerUserId);
        });
    }

    /** A wallet funded through Paystack: Dr Head Office Paystack GL, Cr Head Office Customer Wallet GL. */
    public void postWalletFunding(Double amount, String paymentReference, Long customerUserId) {
        afterCommit(() -> {
            Long headOffice = headOfficeBranchId();
            post("GL-WFUND-" + paymentReference, headOffice, amount,
                    headOffice, GlPurpose.PAYSTACK,
                    headOffice, GlPurpose.CUSTOMER_WALLET,
                    "Wallet funding " + paymentReference, paymentReference, customerUserId);
        });
    }

    /** A product paid for from the wallet: Dr Head Office Customer Wallet GL, Cr branch Sales GL. */
    public void postWalletPurchase(Long branchId, Double amount, String paymentReference, Long customerUserId) {
        afterCommit(() -> {
            Long headOffice = headOfficeBranchId();
            Long branch = branchId != null ? branchId : headOffice;
            post("GL-WPAY-" + paymentReference, branch, amount,
                    headOffice, GlPurpose.CUSTOMER_WALLET,
                    branch, GlPurpose.SALES_REVENUE,
                    "Wallet payment " + paymentReference, paymentReference, customerUserId);
        });
    }

    private void post(String journalReference, Long journalBranchId, Double amount,
                      Long debitBranchId, GlPurpose debitPurpose,
                      Long creditBranchId, GlPurpose creditPurpose,
                      String description, String paymentReference, Long customerUserId) {
        if (amount == null || amount <= 0 || paymentReference == null) {
            return;
        }
        Optional<Account> debitAccount = resolveAccount(debitBranchId, debitPurpose);
        Optional<Account> creditAccount = resolveAccount(creditBranchId, creditPurpose);
        if (debitAccount.isEmpty() || creditAccount.isEmpty()) {
            // Money moved with no journal behind it. That is an accounting hole, not a
            // detail: say which GL is missing, at ERROR, so it is visible in monitoring
            // rather than buried among warnings.
            log.error("GL POSTING SKIPPED for {} ({}): missing {}{}{}. Set it up on the "
                            + "Account Details page - this payment has no journal entry.",
                    paymentReference, amount,
                    debitAccount.isEmpty() ? debitPurpose + " GL for branch " + debitBranchId : "",
                    debitAccount.isEmpty() || creditAccount.isEmpty() ? "" : " and ",
                    creditAccount.isEmpty() ? creditPurpose + " GL for branch " + creditBranchId : "");
            return;
        }
        BigDecimal value = BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);

        JournalLineDto debitLine = new JournalLineDto();
        debitLine.setAccountId(debitAccount.get().getId());
        debitLine.setDescription(description);
        debitLine.setDebit(value);
        debitLine.setUserId(customerUserId);
        debitLine.setReferenceNo(paymentReference);

        JournalLineDto creditLine = new JournalLineDto();
        creditLine.setAccountId(creditAccount.get().getId());
        creditLine.setDescription(description);
        creditLine.setCredit(value);
        creditLine.setUserId(customerUserId);
        creditLine.setReferenceNo(paymentReference);

        CreateJournalEntryDto journalDto = new CreateJournalEntryDto();
        journalDto.setJournalReference(journalReference);
        journalDto.setJournalType(JournalType.GENERAL_JOURNAL);
        journalDto.setTransactionDate(LocalDate.now());
        journalDto.setDescription(description);
        journalDto.setJournalLines(List.of(debitLine, creditLine));

        if (journalEntryService.createSystemJournalEntry(journalDto, journalBranchId)) {
            log.info("Posted GL journal {} for {} ({})", journalReference, paymentReference, value);
        }
    }

    private Optional<Account> resolveAccount(Long branchId, GlPurpose purpose) {
        return accountDetailsRepository.findByBranchIdAndGlPurpose(branchId, purpose)
                .map(AccountDetails::getAccountDetailsCode)
                .flatMap(accountRepository::findByGlCode)
                .filter(account -> !Boolean.FALSE.equals(account.getIsActive()));
    }

    private Long headOfficeBranchId() {
        return branchRepository.findByHeadOfficeTrue()
                .map(Branch::getId)
                .orElseThrow(() -> new IllegalStateException("Head Office branch is not configured"));
    }

    /**
     * Runs the posting once the caller's transaction has committed (or right away when
     * there is none), and swallows any failure so the payment flow is never affected.
     */
    private void afterCommit(Runnable posting) {
        Runnable safe = () -> {
            try {
                posting.run();
            } catch (Exception e) {
                log.error("GL posting failed; the payment itself is unaffected", e);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    safe.run();
                }
            });
        } else {
            safe.run();
        }
    }
}

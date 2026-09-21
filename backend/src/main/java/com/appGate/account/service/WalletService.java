package com.appGate.account.service;

import com.appGate.account.dto.AddMoneyDto;
import com.appGate.account.dto.TransferDto;
import com.appGate.account.enums.TransactionStatus;
import com.appGate.account.enums.TransactionType;
import com.appGate.account.models.Transaction;
import com.appGate.account.models.Wallet;
import com.appGate.account.repository.TransactionRepository;
import com.appGate.account.repository.WalletRepository;
import com.appGate.account.response.BaseResponse;
import com.appGate.rbac.models.User;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.appGate.rbac.service.UserService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentGatewayService paymentGatewayService;
    private final com.appGate.rbac.repository.UserRepository userRepository;
    private final com.appGate.account.repository.CompanyCardRepository companyCardRepository;

    @Transactional
    public BaseResponse createWallet(Long userId) {
        // Check if wallet already exists
        if (walletRepository.existsByUserId(userId)) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Wallet already exists for this user")
                    .build();
        }

        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setBalance(0.0);
        wallet.setCurrency("NGN");
        wallet.setIsActive(true);

        Wallet savedWallet = walletRepository.save(wallet);

        return BaseResponse.builder()
                .status(HttpStatus.CREATED.value())
                .message("Wallet created successfully")
                .data(savedWallet)
                .build();
    }

    @Transactional
    public BaseResponse createCustomerWallet(Long customerId, String phoneNumber) {
        return createCustomerWallet(customerId, phoneNumber, null, null, null);
    }

    @Transactional
    public BaseResponse createCustomerWallet(Long customerId, String phoneNumber, String email,
                                             String firstName, String lastName) {
        if (walletRepository.existsByCustomerId(customerId)) {
            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Wallet already exists for this customer")
                    .build();
        }

        Wallet wallet = new Wallet();
        wallet.setCustomerId(customerId);
        wallet.setBalance(0.0);
        wallet.setCurrency("NGN");
        wallet.setIsActive(true);

        // Try to provision a real Paystack Dedicated Virtual Account; fall back to a placeholder
        // (phone number) when Paystack is not yet configured so customer onboarding never breaks.
        Map<String, String> virtualAccount =
                paymentGatewayService.createDedicatedVirtualAccount(email, firstName, lastName, phoneNumber);
        if (virtualAccount != null && virtualAccount.get("accountNumber") != null) {
            wallet.setAccountNumber(virtualAccount.get("accountNumber"));
            wallet.setBankName(virtualAccount.getOrDefault("bankName", "Paystack"));
        } else {
            wallet.setAccountNumber(phoneNumber);
            wallet.setBankName("PomStores Wallet");
        }

        Wallet savedWallet = walletRepository.save(wallet);

        return BaseResponse.builder()
                .status(HttpStatus.CREATED.value())
                .message("Customer wallet created successfully")
                .data(savedWallet)
                .build();
    }

    private Double getUserWalletBalance(Long userId) {
        return walletRepository.findByUserId(userId)
                .map(Wallet::getBalance)
                .orElse(0.0);
    }


    public BaseResponse getWalletBalance(Long userId) {
        return walletRepository.findByUserId(userId)
                .map(wallet -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("balance", wallet.getBalance());
                    response.put("currency", wallet.getCurrency());
                    response.put("isActive", wallet.getIsActive());

                    return BaseResponse.builder()
                            .status(HttpStatus.OK.value())
                            .message("Wallet balance retrieved successfully")
                            .data(response)
                            .build();
                })
                .orElse(BaseResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Wallet not found")
                        .build());
    }

    @Transactional
    public BaseResponse creditWallet(Long userId, Double amount, String description) {
        try {
            Wallet wallet = walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            Double balanceBefore = wallet.getBalance();
            Double balanceAfter = balanceBefore + amount;

            wallet.setBalance(balanceAfter);
            walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = new Transaction();
            transaction.setUserId(userId);
            transaction.setTransactionReference(generateTransactionReference());
            transaction.setType(TransactionType.CREDIT);
            transaction.setAmount(amount);
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(balanceAfter);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription(description);
            transaction.setTransactionDate(LocalDateTime.now());

            transactionRepository.save(transaction);

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Wallet credited successfully")
                    .data(wallet)
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to credit wallet: " + e.getMessage())
                    .build();
        }
    }

    // Directly credits a customer's wallet (e.g. a cashier funding a walk-in customer's wallet from
    // cash/transfer they have already collected). Resolves the wallet by customerId then account number.
    @Transactional
    public BaseResponse fundCustomerWallet(com.appGate.account.dto.FundWalletDto dto) {
        try {
            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Enter a valid funding amount")
                        .build();
            }

            Wallet wallet = null;
            if (dto.getCustomerId() != null) {
                wallet = walletRepository.findByCustomerId(dto.getCustomerId()).orElse(null);
            }
            if (wallet == null && dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank()) {
                wallet = walletRepository.findByAccountNumber(dto.getAccountNumber()).orElse(null);
            }
            if (wallet == null) {
                // Auto-provision a wallet for the walk-in customer on first funding.
                boolean hasAccount = dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank();
                if (dto.getCustomerId() == null && !hasAccount) {
                    return BaseResponse.builder()
                            .status(HttpStatus.BAD_REQUEST.value())
                            .message("Provide a customer account number or id to fund the wallet")
                            .build();
                }
                wallet = new Wallet();
                wallet.setCustomerId(dto.getCustomerId());
                wallet.setAccountNumber(hasAccount ? dto.getAccountNumber() : null);
                wallet.setBalance(0.0);
                wallet.setCurrency("NGN");
                wallet.setIsActive(true);
                wallet = walletRepository.save(wallet);
            }

            Double balanceBefore = wallet.getBalance();
            Double balanceAfter = balanceBefore + dto.getAmount();
            wallet.setBalance(balanceAfter);
            walletRepository.save(wallet);

            // Transaction.userId is non-null in the schema. Registered customers resolve an id
            // (userId or customerId); for a purely anonymous account-only funding we credit the
            // wallet but skip the ledger record rather than fail the whole funding.
            // Record the payment method (and company card, when funded by card) on the ledger
            // so it's clear how the wallet was funded.
            String fundingMethod = dto.getFundingMethod() != null
                    ? dto.getFundingMethod().trim().toUpperCase() : "";
            String narration = fundingMethod.isBlank() ? null : fundingMethod;
            if ("CARD".equals(fundingMethod)) {
                String cardName = resolveCompanyCardName(dto.getCompanyCardId());
                if ((cardName == null || cardName.isBlank()) && dto.getReferenceNumber() != null) {
                    cardName = dto.getReferenceNumber();
                }
                narration = "CARD" + (cardName != null && !cardName.isBlank() ? " - " + cardName : "");
            } else if (dto.getReferenceNumber() != null && !dto.getReferenceNumber().isBlank()) {
                narration = (narration != null ? narration : "FUNDING") + " - Ref: " + dto.getReferenceNumber();
            }

            Long txUserId = wallet.getUserId() != null ? wallet.getUserId() : wallet.getCustomerId();
            if (txUserId != null) {
                Transaction transaction = new Transaction();
                transaction.setUserId(txUserId);
                transaction.setTransactionReference(generateTransactionReference());
                transaction.setType(TransactionType.CREDIT);
                transaction.setAmount(dto.getAmount());
                transaction.setBalanceBefore(balanceBefore);
                transaction.setBalanceAfter(balanceAfter);
                transaction.setStatus(TransactionStatus.COMPLETED);
                transaction.setDescription(dto.getDescription() != null && !dto.getDescription().isBlank()
                        ? dto.getDescription()
                        : "Walk-in wallet funding by cashier"
                        + (dto.getEnteredBy() != null ? " (" + dto.getEnteredBy() + ")" : ""));
                transaction.setNarration(narration);
                transaction.setRecipientAccountNumber(wallet.getAccountNumber());
                transaction.setTransactionDate(LocalDateTime.now());
                transactionRepository.save(transaction);
            }

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Wallet funded successfully")
                    .data(wallet)
                    .build();
        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to fund wallet: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public BaseResponse debitWallet(Long userId, Double amount, String description) {
        try {
            Wallet wallet = walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));

            if (wallet.getBalance() < amount) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Insufficient wallet balance")
                        .build();
            }

            Double balanceBefore = wallet.getBalance();
            Double balanceAfter = balanceBefore - amount;

            wallet.setBalance(balanceAfter);
            walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = new Transaction();
            transaction.setUserId(userId);
            transaction.setTransactionReference(generateTransactionReference());
            transaction.setType(TransactionType.DEBIT);
            transaction.setAmount(amount);
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(balanceAfter);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription(description);
            transaction.setTransactionDate(LocalDateTime.now());

            transactionRepository.save(transaction);

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Wallet debited successfully")
                    .data(wallet)
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to debit wallet: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public BaseResponse transferFunds(TransferDto dto) {
        try {
            // Debit sender
            BaseResponse debitResponse = debitWallet(
                dto.getFromUserId(),
                dto.getAmount(),
                "TF: " + dto.getRecipientName()
            );

            if (debitResponse.getStatus() != HttpStatus.OK.value()) {
                return debitResponse;
            }

            // Credit recipient
            creditWallet(
                dto.getToUserId(),
                dto.getAmount(),
                "TF: " + dto.getSenderName()
            );

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Transfer completed successfully")
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Transfer failed: " + e.getMessage())
                    .build();
        }
    }

    public BaseResponse addMoney(AddMoneyDto dto) {
        // Initialize payment through Paystack
        // User will be redirected to Paystack to complete payment
        // After payment success, wallet will be credited via webhook or verification

        // Get user email from database
        com.appGate.rbac.models.User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

        return paymentGatewayService.initializeWalletFunding(
                dto.getUserId(),
                dto.getAmount(),
                user.getEmail(),
                dto.getCallbackUrl()
        );
    }

    @Transactional
    public BaseResponse verifyAndFundWallet(String paymentReference) {
        try {
            // Verify payment with Paystack - the entity-returning overload, since
            // verifyPayment() itself now returns a stable PaymentResponseDto for mobile
            // clients (Stage 2 of the order/SalesOrder unification) and can no longer be
            // cast back to the Payment entity here.
            com.appGate.account.models.Payment payment =
                    paymentGatewayService.verifyPaymentEntity(paymentReference);

            if (payment != null) {
                if (payment.getStatus() == com.appGate.account.enums.PaymentStatus.COMPLETED) {
                    Long userId = payment.getUserId();
                    Double amount = payment.getAmount();

                    // Credit wallet
                    creditWallet(userId, amount, "Wallet funded via Paystack - Ref: " + paymentReference);

                    return BaseResponse.builder()
                            .status(HttpStatus.OK.value())
                            .message("Wallet funded successfully")
                            .data(Map.of(
                                    "paymentReference", paymentReference,
                                    "amount", amount,
                                    "walletBalance", getUserWalletBalance(userId)
                            ))
                            .build();
                }
            }

            return BaseResponse.builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Payment verification failed")
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Wallet funding verification error: " + e.getMessage())
                    .build();
        }
    }


    public BaseResponse getTransactionHistory(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
            Page<Transaction> transactions = transactionRepository.findByUserId(userId, pageable);

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Transaction history retrieved successfully")
                    .data(transactions)
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Failed to retrieve transactions: " + e.getMessage())
                    .build();
        }
    }

    private String generateTransactionReference() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String resolveCompanyCardName(String companyCardId) {
        if (companyCardId == null || companyCardId.isBlank()) return null;
        try {
            Long id = Long.parseLong(companyCardId.trim());
            return companyCardRepository.findById(id)
                    .map(com.appGate.account.models.CompanyCard::getCardName)
                    .orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

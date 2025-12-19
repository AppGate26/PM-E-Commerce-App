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
            // Verify payment with Paystack
            BaseResponse paymentVerification = paymentGatewayService.verifyPayment(paymentReference);

            if (paymentVerification.getStatus() == HttpStatus.OK.value()) {
                // Extract payment details from verification response
                Map<String, Object> paymentData = (Map<String, Object>) paymentVerification.getData();

                if (paymentData.get("status").toString().equals("COMPLETED")) {
                    Long userId = ((Number) paymentData.get("userId")).longValue();
                    Double amount = ((Number) paymentData.get("amount")).doubleValue();

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
}

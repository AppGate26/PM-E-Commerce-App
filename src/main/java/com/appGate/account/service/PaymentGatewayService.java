package com.appGate.account.service;

import com.appGate.account.dto.InitializePaymentDto;
import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.enums.TransactionStatus;
import com.appGate.account.enums.TransactionType;
import com.appGate.account.models.Payment;
import com.appGate.account.models.Transaction;
import com.appGate.account.models.Wallet;
import com.appGate.account.repository.PaymentRepository;
import com.appGate.account.repository.TransactionRepository;
import com.appGate.account.repository.WalletRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentGatewayService {

    @Value("${paystack.secret.key:sk_test_xxx}")
    private String paystackSecretKey;

    @Value("${paystack.base.url:https://api.paystack.co}")
    private String paystackBaseUrl;

    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public BaseResponse initializeCardPayment(InitializePaymentDto dto) {
        try {
            // Get user email from database
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            // Create payment record
            Payment payment = new Payment();
            payment.setOrderId(null); // No order for direct payment
            payment.setUserId(dto.getUserId());
            payment.setAmount(dto.getAmount());
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference()); // ✅ Generates unique reference for Paystack
            payment.setIsInstallmentPayment(false);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);

            // Initialize Paystack payment
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail()); // ✅ Email from database
            requestBody.put("amount", (int) (dto.getAmount() * 100)); // Paystack uses kobo
            requestBody.put("reference", savedPayment.getPaymentReference()); // ✅ Paystack uses this reference
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("metadata", Map.of(
                "userId", dto.getUserId(),
                "paymentId", savedPayment.getId(),
                "type", "CARD_PAYMENT"
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                paystackBaseUrl + "/transaction/initialize",
                request,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseData = response.getBody();
                Map<String, Object> data = (Map<String, Object>) responseData.get("data");

                Map<String, Object> result = new HashMap<>();
                result.put("paymentId", savedPayment.getId());
                result.put("paymentReference", savedPayment.getPaymentReference());
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize payment")
                        .build();
            }

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public BaseResponse verifyPayment(String reference) {
        try {
            Payment payment = paymentRepository.findByPaymentReference(reference)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));

            // Verify with Paystack
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);

            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                paystackBaseUrl + "/transaction/verify/" + reference,
                HttpMethod.GET,
                request,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                String status = (String) data.get("status");

                if ("success".equals(status)) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaidAt(LocalDateTime.now());
                    payment.setGatewayReference((String) data.get("reference"));
                    payment.setGatewayResponse(responseBody.toString());
                } else {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureReason("Payment verification failed");
                }

                paymentRepository.save(payment);

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Payment verified successfully")
                        .data(payment)
                        .build();
            }

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Payment verification error: " + e.getMessage())
                    .build();
        }

        return BaseResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Payment verification failed")
                .build();
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        try {
            String event = (String) payload.get("event");

            if ("charge.success".equals(event)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                String reference = (String) data.get("reference");
                Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");

                Payment payment = paymentRepository.findByPaymentReference(reference)
                        .orElse(null);

                if (payment != null && payment.getStatus() != PaymentStatus.COMPLETED) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaidAt(LocalDateTime.now());
                    payment.setGatewayResponse(payload.toString());
                    paymentRepository.save(payment);

                    // Check if this is wallet funding
                    if (metadata != null && "WALLET_FUNDING".equals(metadata.get("type"))) {
                        // Credit wallet
                        creditWalletAfterPayment(payment.getUserId(), payment.getAmount(), reference);
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't throw - webhooks should always return 200
            System.err.println("Webhook processing error: " + e.getMessage());
        }
    }

    private void creditWalletAfterPayment(Long userId, Double amount, String reference) {
        try {
            // Get or create wallet
            Wallet wallet = walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found for user: " + userId));

            Double balanceBefore = wallet.getBalance();
            wallet.setBalance(balanceBefore + amount);
            walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = new Transaction();
            transaction.setUserId(userId);
            transaction.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            transaction.setType(TransactionType.CREDIT);
            transaction.setAmount(amount);
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(wallet.getBalance());
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription("Wallet funded via Paystack - Ref: " + reference);
            transaction.setTransactionDate(LocalDateTime.now());
            transactionRepository.save(transaction);

            System.out.println("Wallet credited: User " + userId + ", Amount: " + amount);
        } catch (Exception e) {
            System.err.println("Wallet credit error: " + e.getMessage());
        }
    }

    @Transactional
    public BaseResponse initializeWalletFunding(Long userId, Double amount, String email, String callbackUrl) {
        try {
            // Create payment record for wallet funding
            Payment payment = new Payment();
            payment.setUserId(userId);
            payment.setAmount(amount);
            payment.setPaymentMethod(PaymentMethod.WALLET); // Using WALLET to indicate wallet funding
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setOrderId(null); // No order for wallet funding

            Payment savedPayment = paymentRepository.save(payment);

            // Initialize Paystack payment
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            requestBody.put("amount", (int) (amount * 100)); // Paystack uses kobo
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", callbackUrl);
            requestBody.put("metadata", Map.of(
                "userId", userId,
                "paymentId", savedPayment.getId(),
                "type", "WALLET_FUNDING"
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                paystackBaseUrl + "/transaction/initialize",
                request,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseData = response.getBody();
                Map<String, Object> data = (Map<String, Object>) responseData.get("data");

                Map<String, Object> result = new HashMap<>();
                result.put("paymentId", savedPayment.getId());
                result.put("paymentReference", savedPayment.getPaymentReference());
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Wallet funding initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize wallet funding")
                        .build();
            }

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Wallet funding initialization error: " + e.getMessage())
                    .build();
        }
    }

    private String generatePaymentReference() {
        return "PM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

package com.appGate.account.service;

import com.appGate.account.dto.InitializeDownPaymentDto;
import com.appGate.account.dto.InitializePaymentDto;
import com.appGate.account.enums.InstallmentStatus;
import com.appGate.account.enums.PaymentMethod;
import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.enums.TransactionStatus;
import com.appGate.account.enums.TransactionType;
import com.appGate.account.models.InstallmentPlan;
import com.appGate.account.models.Payment;
import com.appGate.account.models.Transaction;
import com.appGate.account.models.Wallet;
import com.appGate.account.repository.PaymentRepository;
import com.appGate.account.repository.TransactionRepository;
import com.appGate.account.repository.WalletRepository;
import com.appGate.orderingsales.enums.OrderStatus;
import com.appGate.orderingsales.models.Order;
import com.appGate.orderingsales.repository.OrderRepository;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import com.appGate.account.response.BaseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentGatewayService {

    @Value("${paystack.secret.key:sk_test_xxx}")
    private String paystackSecretKey;

    // Static so Lombok's @RequiredArgsConstructor does not try to inject it.
    private static final com.fasterxml.jackson.databind.ObjectMapper webhookMapper =
            new com.fasterxml.jackson.databind.ObjectMapper();

    // Set paystack.webhook.verify-signature=false ONLY for local testing with hand-made
    // webhook calls; in any deployed environment this must stay true.
    @Value("${paystack.webhook.verify-signature:true}")
    private boolean verifyWebhookSignature;

    @Value("${paystack.base.url:https://api.paystack.co}")
    private String paystackBaseUrl;

    // Bank used by Paystack to issue Dedicated Virtual Accounts (e.g. "wema-bank", "titan-paystack",
    // or "test-bank" in test mode). Override per environment.
    @Value("${paystack.preferred.bank:test-bank}")
    private String paystackPreferredBank;

    // Email used to open the Paystack checkout when a walk-in customer has no email on file.
    @Value("${store.default.email:store@pomstores.com}")
    private String storeDefaultEmail;

    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final com.appGate.account.repository.InstallmentPlanRepository installmentPlanRepository;
    private final com.appGate.account.repository.InstallmentRepository installmentRepository;
    private final com.appGate.account.repository.CashierWalletFundingRepository cashierWalletFundingRepository;
    private final com.appGate.account.repository.CompanyCardRepository companyCardRepository;
    private final com.appGate.orderingsales.service.MobileSalesOrderSyncService mobileSalesOrderSyncService;
    private final com.appGate.orderingsales.service.DeliveryFeeQuoteService deliveryFeeQuoteService;
    private final com.appGate.rbac.service.BranchScopeService branchScopeService;
    private final com.appGate.orderingsales.repository.CartRepository cartRepository;
    private final GlPostingService glPostingService;

    /** Amount + installment flag returned by {@link #resolveOrderChargeAmount}. */
    private static class OrderCharge {
        final Double amount;
        final boolean isInstallmentPayment;
        // How much of `amount` is the outstanding delivery fee portion - 0 for a non-
        // installment order (its full grandTotal, delivery included, is one undivided
        // charge with nothing left for applyDownPaymentCollected to track separately).
        final Double deliveryFeeAmount;

        OrderCharge(Double amount, boolean isInstallmentPayment) {
            this(amount, isInstallmentPayment, 0.0);
        }

        OrderCharge(Double amount, boolean isInstallmentPayment, Double deliveryFeeAmount) {
            this.amount = amount;
            this.isInstallmentPayment = isInstallmentPayment;
            this.deliveryFeeAmount = deliveryFeeAmount;
        }
    }

    /**
     * The authoritative amount to charge for a payment against an existing order -
     * never a client-supplied amount, so no caller can attach an order id to an
     * arbitrarily low payment. For an installment order this is only the up-front down
     * payment (outstanding delivery fee + plan.getDownPayment()) - or, if that down
     * payment was already collected via the pre-checkout {@link #initializeDownPaymentBankTransfer}
     * flow, just whatever delivery fee is still outstanding. That flow charges the delivery
     * fee in full as part of its own charge (see {@link #resolveDownPaymentDeliveryFee}),
     * so plan.getDownPaymentDeliveryFee() tracks how much of order.getDeliveryFee() was
     * already paid there and this normally has nothing left to collect - it stays 0/null
     * only when no delivery fee could be determined at down-payment time (e.g. the
     * customer was never quoted one), in which case the full fee is still collected here.
     * For a one-off order it's the full grandTotal.
     * Mirrors OrderService.payOrderByWallet's identical branching.
     */
    private OrderCharge resolveOrderChargeAmount(Order order) {
        boolean isInstallmentPayment = order.getPaymentType() == com.appGate.orderingsales.enums.PaymentType.INSTALLMENT;
        if (!isInstallmentPayment) {
            return new OrderCharge(order.getGrandTotal(), false);
        }
        InstallmentPlan plan = installmentPlanRepository
                .findById(order.getInstallmentPlanId())
                .orElseThrow(() -> new RuntimeException("Installment plan not found for order " + order.getId()));
        double alreadyCollectedDeliveryFee = plan.getDownPaymentDeliveryFee() != null
                ? plan.getDownPaymentDeliveryFee() : 0.0;
        double outstandingDeliveryFee = Math.max(0.0, order.getDeliveryFee() - alreadyCollectedDeliveryFee);
        double amount = Boolean.TRUE.equals(plan.getDownPaymentPaid())
                ? outstandingDeliveryFee
                : outstandingDeliveryFee + plan.getDownPayment();
        return new OrderCharge(amount, true, outstandingDeliveryFee);
    }

    /**
     * True if the order-level charge resolveOrderChargeAmount computes was already
     * collected and a new attempt must be refused: {@code isPaid} (a one-off order fully
     * paid, or an installment plan fully settled), or a Payment already linked to this
     * orderId. A Payment.orderId is only ever set by an order-level charge actually
     * running (this service's card/bank-transfer/wallet-equivalent paths) - unlike
     * order.getPaidAt(), it is NOT set merely by OrderService.checkout() reflecting a
     * plan's pre-checkout down payment (see initializeDownPaymentBankTransfer, which
     * links its Payment to the installmentPlanId with orderId left null, since no order
     * exists yet). Relying on paidAt alone used to make every path here refuse outright
     * once a pre-paid plan was linked to an order, leaving that order's delivery fee -
     * never included in the pre-checkout charge - uncollected forever.
     *
     * <p>Only a payment that actually settled counts. A Payment row is created at
     * <em>initialize</em> time with status PENDING, so counting every row here refused
     * a retry after any abandoned, failed or cancelled attempt - the customer was told
     * "Order has already been paid" for an order nobody had paid, with no way out but a
     * brand-new order (which re-decrements stock). PROCESSING counts too: that money is
     * in flight and charging again would double-bill.
     */
    /**
     * Retires earlier, still-PENDING attempts on the same order when a new one is started.
     *
     * <p>Every initialize mints a fresh reference and row, so without this an order can
     * carry several live Paystack transactions at once and the customer can be charged
     * twice for it. Cancelling the old rows does not make their money vanish: if a
     * superseded attempt is nevertheless completed, the webhook still records it (it only
     * skips rows already COMPLETED) and {@link #markOrderPaid} flags the duplicate.
     */
    private void supersedePendingOrderPayments(Long orderId, Long keepPaymentId) {
        if (orderId == null) {
            return;
        }
        paymentRepository.findByOrderId(orderId).stream()
                .filter(existing -> existing.getStatus() == PaymentStatus.PENDING)
                .filter(existing -> !existing.getId().equals(keepPaymentId))
                .forEach(existing -> {
                    existing.setStatus(PaymentStatus.CANCELLED);
                    existing.setFailureReason("Superseded by a newer payment attempt on this order");
                    paymentRepository.save(existing);
                });
    }

    /**
     * True when the signed-in caller is paying an order that is not theirs. The order id
     * comes straight off the URL, so without this anyone could start a charge against
     * somebody else's order. Unauthenticated callers (the webhook) are not judged here.
     */
    private boolean isSomeoneElsesOrder(Order order) {
        return isSomeoneElsesUserId(order.getUserId());
    }

    /**
     * True when a request body claims to act for a different user than the signed-in one.
     *
     * <p>Staff are exempt: a cashier funding a walk-in customer's wallet, or an admin
     * settling an order, is legitimately acting for somebody else. This only stops one
     * shopper from paying against another shopper's order or payment.
     */
    private boolean isSomeoneElsesUserId(Long claimedUserId) {
        if (branchScopeService.isUnrestricted() || branchScopeService.isBranchScoped()) {
            return false;
        }
        Long callerId = branchScopeService.getCurrentUser().map(User::getId).orElse(null);
        return callerId != null && claimedUserId != null && !claimedUserId.equals(callerId);
    }

    private boolean orderPaymentAlreadyCollected(Order order) {
        return Boolean.TRUE.equals(order.getIsPaid())
                || paymentRepository.findByOrderId(order.getId()).stream()
                        .anyMatch(payment -> payment.getStatus() == PaymentStatus.COMPLETED
                                || payment.getStatus() == PaymentStatus.PROCESSING);
    }

    /**
     * Initializes a Paystack card payment. When {@code dto.getOrderId()} is set, this
     * links the {@link Payment} to that order and charges its authoritative
     * server-computed amount (never dto.getAmount()) - the same order-linking
     * {@link #initializeBankTransferPayment}/{@link #initializeBankPayment} already do -
     * so the resulting payment is correctly picked up by markOrderPaid on webhook/verify.
     * Without an orderId this behaves exactly as before: a plain, unlinked direct
     * payment for dto.getAmount(). Previously this method ignored dto.getOrderId()
     * entirely even though the DTO documents it as generally supported - a one-off
     * mobile order paid this way never got marked paid despite Paystack charging the
     * card, the same class of bug INSTALLMENT_DOWN_PAYMENT_FLOW.md documents for the
     * installment down payment.
     * <p>
     * Without an orderId this is a wallet top-up or a direct payment. It is charged for
     * exactly dto.getAmount() and left unlinked: it is never guessed onto an order or an
     * installment plan, and no delivery fee is folded into it.
     */
    @Transactional
    public BaseResponse initializeCardPayment(InitializePaymentDto dto) {
        try {
            // Get user email from database
            if (isSomeoneElsesUserId(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("You may only pay as yourself")
                        .build();
            }

            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            Order order = null;
            Double amount = dto.getAmount();
            boolean isInstallmentPayment = false;
            Double deliveryFeeAmount = 0.0;
            if (dto.getOrderId() != null) {
                order = orderRepository.findById(dto.getOrderId())
                        .orElseThrow(() -> new RuntimeException("Order not found with ID: " + dto.getOrderId()));
                if (!order.getUserId().equals(dto.getUserId())) {
                    return BaseResponse.builder()
                            .status(HttpStatus.FORBIDDEN.value())
                            .message("This order does not belong to the requesting user")
                            .build();
                }
                if (orderPaymentAlreadyCollected(order)) {
                    return BaseResponse.builder()
                            .status(HttpStatus.BAD_REQUEST.value())
                            .message("Order has already been paid")
                            .build();
                }
                OrderCharge charge = resolveOrderChargeAmount(order);
                amount = charge.amount;
                isInstallmentPayment = charge.isInstallmentPayment;
                deliveryFeeAmount = charge.deliveryFeeAmount;
            }

            // With no orderId this is a wallet top-up or a direct payment, and it stays
            // exactly that: it is never guessed onto an installment plan, and no delivery
            // fee is folded into it. A purchase always arrives with its orderId.

            // Create payment record
            Payment payment = new Payment();
            payment.setOrderId(order != null ? order.getId() : null);
            payment.setInstallmentPlanId(null);
            payment.setUserId(dto.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(deliveryFeeAmount);
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference()); // ✅ Generates unique reference for Paystack
            payment.setIsInstallmentPayment(isInstallmentPayment);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);
            supersedePendingOrderPayments(savedPayment.getOrderId(), savedPayment.getId());

            // Initialize Paystack payment
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("userId", dto.getUserId());
            metadata.put("paymentId", savedPayment.getId());
            metadata.put("type", order != null ? "ORDER_PAYMENT" : "CARD_PAYMENT");
            if (order != null) {
                metadata.put("orderId", order.getId());
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail()); // ✅ Email from database
            requestBody.put("amount", (int) (amount * 100)); // Paystack uses kobo
            requestBody.put("reference", savedPayment.getPaymentReference()); // ✅ Paystack uses this reference
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("channels", new String[]{"card"}); // ✅ Restrict to CARD only
            requestBody.put("metadata", metadata);

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
                result.put("orderId", order != null ? order.getId() : null);
                result.put("amount", amount);
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
            e.printStackTrace(); // Log full stack trace for debugging
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Initializes a Paystack bank-transfer payment. When {@code dto.getOrderId()} is
     * set, this links the {@link Payment} to that order and charges its authoritative
     * server-computed amount (never dto.getAmount(), the same way
     * {@link #initializeOrderCardPayment} already does for card) - so the resulting
     * payment is correctly picked up by markOrderPaid on webhook/verify. Without an
     * orderId this behaves exactly as before: a plain, unlinked top-up for
     * dto.getAmount().
     */
    @Transactional
    public BaseResponse initializeBankTransferPayment(InitializePaymentDto dto) {
        try {
            if (isSomeoneElsesUserId(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("You may only pay as yourself")
                        .build();
            }

            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            Order order = null;
            Double amount = dto.getAmount();
            boolean isInstallmentPayment = false;
            Double deliveryFeeAmount = 0.0;
            if (dto.getOrderId() != null) {
                order = orderRepository.findById(dto.getOrderId())
                        .orElseThrow(() -> new RuntimeException("Order not found with ID: " + dto.getOrderId()));
                if (!order.getUserId().equals(dto.getUserId())) {
                    return BaseResponse.builder()
                            .status(HttpStatus.FORBIDDEN.value())
                            .message("This order does not belong to the requesting user")
                            .build();
                }
                if (orderPaymentAlreadyCollected(order)) {
                    return BaseResponse.builder()
                            .status(HttpStatus.BAD_REQUEST.value())
                            .message("Order has already been paid")
                            .build();
                }
                OrderCharge charge = resolveOrderChargeAmount(order);
                amount = charge.amount;
                isInstallmentPayment = charge.isInstallmentPayment;
                deliveryFeeAmount = charge.deliveryFeeAmount;
            }

            // No orderId means a wallet top-up / direct payment - never guessed onto an
            // installment plan, and never given a delivery fee (see initializeCardPayment).

            Payment payment = new Payment();
            payment.setOrderId(order != null ? order.getId() : null);
            payment.setInstallmentPlanId(null);
            payment.setUserId(dto.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(deliveryFeeAmount);
            payment.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setIsInstallmentPayment(isInstallmentPayment);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);
            supersedePendingOrderPayments(savedPayment.getOrderId(), savedPayment.getId());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("userId", dto.getUserId());
            metadata.put("paymentId", savedPayment.getId());
            metadata.put("type", order != null ? "ORDER_PAYMENT" : "BANK_TRANSFER_PAYMENT");
            if (order != null) {
                metadata.put("orderId", order.getId());
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail());
            requestBody.put("amount", (int) (amount * 100));
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("channels", new String[]{"bank_transfer"});
            requestBody.put("metadata", metadata);

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
                result.put("orderId", order != null ? order.getId() : null);
                result.put("amount", amount);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Bank transfer payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize bank transfer payment")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Bank transfer initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Initializes a Paystack USSD ("bank") payment. Same order-linking behavior as
     * {@link #initializeBankTransferPayment} - see its javadoc.
     */
    @Transactional
    public BaseResponse initializeBankPayment(InitializePaymentDto dto) {
        try {
            if (isSomeoneElsesUserId(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("You may only pay as yourself")
                        .build();
            }

            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            Order order = null;
            Double amount = dto.getAmount();
            boolean isInstallmentPayment = false;
            Double deliveryFeeAmount = 0.0;
            if (dto.getOrderId() != null) {
                order = orderRepository.findById(dto.getOrderId())
                        .orElseThrow(() -> new RuntimeException("Order not found with ID: " + dto.getOrderId()));
                if (!order.getUserId().equals(dto.getUserId())) {
                    return BaseResponse.builder()
                            .status(HttpStatus.FORBIDDEN.value())
                            .message("This order does not belong to the requesting user")
                            .build();
                }
                if (orderPaymentAlreadyCollected(order)) {
                    return BaseResponse.builder()
                            .status(HttpStatus.BAD_REQUEST.value())
                            .message("Order has already been paid")
                            .build();
                }
                OrderCharge charge = resolveOrderChargeAmount(order);
                amount = charge.amount;
                isInstallmentPayment = charge.isInstallmentPayment;
                deliveryFeeAmount = charge.deliveryFeeAmount;
            }

            // No orderId means a wallet top-up / direct payment - never guessed onto an
            // installment plan, and never given a delivery fee (see initializeCardPayment).

            Payment payment = new Payment();
            payment.setOrderId(order != null ? order.getId() : null);
            payment.setInstallmentPlanId(null);
            payment.setUserId(dto.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(deliveryFeeAmount);
            payment.setPaymentMethod(PaymentMethod.BANK);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setIsInstallmentPayment(isInstallmentPayment);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);
            supersedePendingOrderPayments(savedPayment.getOrderId(), savedPayment.getId());

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("userId", dto.getUserId());
            metadata.put("paymentId", savedPayment.getId());
            metadata.put("type", order != null ? "ORDER_PAYMENT" : "BANK_PAYMENT");
            if (order != null) {
                metadata.put("orderId", order.getId());
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail());
            requestBody.put("amount", (int) (amount * 100));
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("channels", new String[]{"ussd"});
            requestBody.put("metadata", metadata);

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
                result.put("orderId", order != null ? order.getId() : null);
                result.put("amount", amount);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Bank payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize bank payment")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Bank payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Initializes a Paystack card payment for an existing order (goods bought).
     * Unlike {@link #initializeCardPayment} this links the {@link Payment} to the order, charges the
     * order's authoritative grandTotal (never a client-supplied amount), and tags the gateway
     * metadata as ORDER_PAYMENT so the webhook/verify flow can mark the order paid on success.
     */
    @Transactional
    public BaseResponse initializeOrderCardPayment(Long orderId, String callbackUrl) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

            if (isSomeoneElsesOrder(order)) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This order does not belong to the requesting user")
                        .build();
            }

            if (orderPaymentAlreadyCollected(order)) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Order has already been paid")
                        .build();
            }

            User user = userRepository.findById(order.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + order.getUserId()));

            // For installment orders, a card charge here is only ever the up-front down
            // payment - never the full plan, exactly like OrderService.payOrderByWallet
            // already does for the wallet path. Without this, a customer paying by card
            // was being charged the entire order total.
            OrderCharge charge = resolveOrderChargeAmount(order);
            Double amount = charge.amount;
            boolean isInstallmentPayment = charge.isInstallmentPayment;

            // Create payment record linked to the order
            Payment payment = new Payment();
            payment.setOrderId(order.getId());
            payment.setUserId(order.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(charge.deliveryFeeAmount);
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setIsInstallmentPayment(isInstallmentPayment);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);
            supersedePendingOrderPayments(savedPayment.getOrderId(), savedPayment.getId());

            // Initialize Paystack payment
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail());
            requestBody.put("amount", (int) (amount * 100)); // Paystack uses kobo
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", callbackUrl);
            requestBody.put("channels", new String[]{"card"});
            requestBody.put("metadata", Map.of(
                "userId", order.getUserId(),
                "paymentId", savedPayment.getId(),
                "orderId", order.getId(),
                "type", "ORDER_PAYMENT"
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
                result.put("orderId", order.getId());
                result.put("orderNumber", order.getOrderNumber());
                result.put("amount", amount);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Order payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize order payment")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Order payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Initializes a Paystack bank-transfer payment for an installment plan's up-front
     * down payment, collected BEFORE the plan has an order attached. Confirmed from
     * production data: the mobile checkout flow pays this down payment first, then
     * calls OrderService.checkout() to create the order afterward (order creation
     * follows payment completion by about a second) - so unlike
     * initializeOrderCardPayment there is no order yet to link this Payment to.
     * Instead this marks the plan itself once Paystack confirms (see
     * markDownPaymentPaid); OrderService.checkout() reads that back when it links the
     * plan to the new order, to reflect the payment immediately instead of waiting for
     * a payOrderByWallet-style call that never comes for this flow.
     *
     * The delivery fee is never financed across the plan's installments - it's charged
     * here, in full, on top of the down payment (see {@link #resolveDownPaymentDeliveryFee},
     * which prices it from dto's delivery destination when the caller sends one and
     * otherwise recovers the fee the customer was already quoted). This is the only
     * charge this flow ever makes: OrderService.checkout() merely reflects the down
     * payment already paid here, it triggers no follow-up charge, so a fee left out
     * here is a fee never collected.
     */
    @Transactional
    public BaseResponse initializeDownPaymentBankTransfer(Long planId, InitializeDownPaymentDto dto) {
        try {
            InstallmentPlan plan = installmentPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Installment plan not found"));

            if (!plan.getUserId().equals(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This installment plan does not belong to the requesting user")
                        .build();
            }
            if (plan.getOrderId() != null) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("This installment plan is already attached to an order - pay through the order instead")
                        .build();
            }
            if (Boolean.TRUE.equals(plan.getDownPaymentPaid())) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("The down payment for this plan has already been paid")
                        .build();
            }

            if (isSomeoneElsesUserId(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("You may only pay as yourself")
                        .build();
            }

            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            // Server-computed, never a client-supplied amount - same principle as
            // resolveOrderChargeAmount. The delivery fee is charged here in full (see
            // resolveDownPaymentDeliveryFee), not financed across the plan's installments.
            java.math.BigDecimal deliveryFee = resolveDownPaymentDeliveryFee(plan, dto);
            Double amount = plan.getDownPayment() + deliveryFee.doubleValue();

            Payment payment = new Payment();
            payment.setOrderId(null);
            payment.setInstallmentPlanId(planId);
            payment.setUserId(dto.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(deliveryFee.doubleValue());
            payment.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setIsInstallmentPayment(true);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("userId", dto.getUserId());
            metadata.put("paymentId", savedPayment.getId());
            metadata.put("installmentPlanId", planId);
            metadata.put("type", "INSTALLMENT_DOWN_PAYMENT");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail());
            requestBody.put("amount", (int) (amount * 100));
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("channels", new String[]{"bank_transfer"});
            requestBody.put("metadata", metadata);

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
                result.put("installmentPlanId", planId);
                result.put("amount", amount);
                result.put("downPayment", plan.getDownPayment());
                result.put("deliveryFee", deliveryFee);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Down payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize down payment")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Down payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Same pre-checkout down payment flow as {@link #initializeDownPaymentBankTransfer},
     * but restricted to the "card" Paystack channel instead of "bank_transfer". Added
     * because the mobile app's card-payment down payment was found to be calling the
     * generic {@link #initializeCardPayment} instead - that call sets both
     * Payment.orderId and Payment.installmentPlanId to null, so verifying it never
     * reaches markOrderPaid/markDownPaymentPaid and the plan's down payment is never
     * recorded even though Paystack charged the card successfully. Charges the delivery
     * fee in full alongside the down payment, exactly as that method does.
     */
    @Transactional
    public BaseResponse initializeDownPaymentCard(Long planId, InitializeDownPaymentDto dto) {
        try {
            InstallmentPlan plan = installmentPlanRepository.findById(planId)
                    .orElseThrow(() -> new RuntimeException("Installment plan not found"));

            if (!plan.getUserId().equals(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This installment plan does not belong to the requesting user")
                        .build();
            }
            if (plan.getOrderId() != null) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("This installment plan is already attached to an order - pay through the order instead")
                        .build();
            }
            if (Boolean.TRUE.equals(plan.getDownPaymentPaid())) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("The down payment for this plan has already been paid")
                        .build();
            }

            if (isSomeoneElsesUserId(dto.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("You may only pay as yourself")
                        .build();
            }

            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getUserId()));

            // Server-computed, never a client-supplied amount - same principle as
            // resolveOrderChargeAmount. The delivery fee is charged here in full (see
            // resolveDownPaymentDeliveryFee), not financed across the plan's installments.
            java.math.BigDecimal deliveryFee = resolveDownPaymentDeliveryFee(plan, dto);
            Double amount = plan.getDownPayment() + deliveryFee.doubleValue();

            Payment payment = new Payment();
            payment.setOrderId(null);
            payment.setInstallmentPlanId(planId);
            payment.setUserId(dto.getUserId());
            payment.setAmount(amount);
            payment.setDeliveryFeeAmount(deliveryFee.doubleValue());
            payment.setPaymentMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PENDING);
            payment.setPaymentReference(generatePaymentReference());
            payment.setIsInstallmentPayment(true);
            payment.setInstallmentId(null);

            Payment savedPayment = paymentRepository.save(payment);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("userId", dto.getUserId());
            metadata.put("paymentId", savedPayment.getId());
            metadata.put("installmentPlanId", planId);
            metadata.put("type", "INSTALLMENT_DOWN_PAYMENT");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", user.getEmail());
            requestBody.put("amount", (int) (amount * 100));
            requestBody.put("reference", savedPayment.getPaymentReference());
            requestBody.put("callback_url", dto.getCallbackUrl());
            requestBody.put("channels", new String[]{"card"});
            requestBody.put("metadata", metadata);

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
                result.put("installmentPlanId", planId);
                result.put("amount", amount);
                result.put("downPayment", plan.getDownPayment());
                result.put("deliveryFee", deliveryFee);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Down payment initialized successfully")
                        .data(result)
                        .build();
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(savedPayment);

                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize down payment")
                        .build();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Down payment initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Creates a Paystack customer and a Dedicated Virtual Account (DVA) for that customer.
     * Returns a map with "accountNumber" and "bankName", or {@code null} when Paystack is not
     * configured (default test key), required data is missing, or any Paystack call fails — callers
     * should fall back gracefully so wallet creation never breaks.
     */
    public Map<String, String> createDedicatedVirtualAccount(String email, String firstName,
                                                             String lastName, String phone) {
        try {
            if (paystackSecretKey == null || paystackSecretKey.isBlank()
                    || "sk_test_xxx".equals(paystackSecretKey)
                    || email == null || email.isBlank()) {
                // Paystack not configured or no email to register a customer with.
                return null;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 1. Create (or fetch) the Paystack customer.
            Map<String, Object> customerBody = new HashMap<>();
            customerBody.put("email", email);
            if (firstName != null) customerBody.put("first_name", firstName);
            if (lastName != null) customerBody.put("last_name", lastName);
            if (phone != null && !phone.isBlank()) customerBody.put("phone", phone);

            ResponseEntity<Map> customerResponse = restTemplate.postForEntity(
                    paystackBaseUrl + "/customer",
                    new HttpEntity<>(customerBody, headers),
                    Map.class
            );

            if (customerResponse.getStatusCode() != HttpStatus.OK || customerResponse.getBody() == null) {
                return null;
            }
            Map<String, Object> customerData = (Map<String, Object>) customerResponse.getBody().get("data");
            if (customerData == null || customerData.get("customer_code") == null) {
                return null;
            }
            String customerCode = String.valueOf(customerData.get("customer_code"));

            // 2. Assign a Dedicated Virtual Account to the customer.
            Map<String, Object> dvaBody = new HashMap<>();
            dvaBody.put("customer", customerCode);
            dvaBody.put("preferred_bank", paystackPreferredBank);

            ResponseEntity<Map> dvaResponse = restTemplate.postForEntity(
                    paystackBaseUrl + "/dedicated_account",
                    new HttpEntity<>(dvaBody, headers),
                    Map.class
            );

            if (dvaResponse.getStatusCode() != HttpStatus.OK || dvaResponse.getBody() == null) {
                return null;
            }
            Map<String, Object> dvaData = (Map<String, Object>) dvaResponse.getBody().get("data");
            if (dvaData == null || dvaData.get("account_number") == null) {
                return null;
            }
            Map<String, Object> bank = (Map<String, Object>) dvaData.get("bank");

            Map<String, String> result = new HashMap<>();
            result.put("accountNumber", String.valueOf(dvaData.get("account_number")));
            result.put("bankName", bank != null && bank.get("name") != null
                    ? String.valueOf(bank.get("name")) : "");
            return result;
        } catch (Exception e) {
            // Never let a payment-gateway hiccup block customer/wallet creation.
            e.printStackTrace();
            return null;
        }
    }

    @Transactional
    public BaseResponse verifyPayment(String reference) {
        try {
            // Verifying settles the payment and can mark an order paid, so it is not a
            // read-only lookup: a signed-in caller may only verify their own payments.
            Payment existing = paymentRepository.findByPaymentReference(reference).orElse(null);
            if (existing != null && isSomeoneElsesUserId(existing.getUserId())) {
                return BaseResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .message("This payment does not belong to the requesting user")
                        .build();
            }

            Payment payment = doVerifyPayment(reference);
            if (payment == null) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Payment verification failed")
                        .build();
            }

            return BaseResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Payment verified successfully")
                    .data(com.appGate.account.dto.PaymentResponseDto.from(payment))
                    .build();

        } catch (Exception e) {
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Payment verification error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Same Paystack verification as {@link #verifyPayment}, returning the updated
     * {@link Payment} entity directly - for in-process callers (WalletService.
     * verifyAndFundWallet) that need real entity fields, added so verifyPayment could
     * switch to returning a stable {@code PaymentResponseDto} (mobile wire-contract
     * freeze, Stage 2 of the order/SalesOrder unification) without breaking this caller.
     */
    public Payment verifyPaymentEntity(String reference) {
        return doVerifyPayment(reference);
    }

    private Payment doVerifyPayment(String reference) {
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

            // Paystack's verify reports the transaction's CURRENT state, which for a
            // charge still in flight is "ongoing"/"pending"/"abandoned"/"queued" - not a
            // failure. Marking those FAILED (as this used to) was terminal: the app saw
            // FAILED and showed an error, while the charge went on to succeed and pay the
            // order via the webhook seconds later. Only an explicit failure is FAILED; an
            // in-flight charge is left PENDING so the caller can verify again.
            if ("success".equals(status)) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
                payment.setGatewayReference((String) data.get("reference"));
                payment.setGatewayResponse(responseBody.toString());
            } else if (isFinalPaystackFailure(status)) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment verification failed: " + status);
            } else if (payment.getStatus() != PaymentStatus.COMPLETED) {
                payment.setStatus(PaymentStatus.PENDING);
            }

            paymentRepository.save(payment);

            if (payment.getStatus() == PaymentStatus.COMPLETED) {
                // No orphan-adoption guesswork here any more: the mobile app is order-first,
                // so a purchase always carries its orderId (or installmentPlanId) from
                // initialize. A payment that reaches here with neither is a wallet top-up or a
                // direct payment, and must NOT be attached to anybody's order.
                // If this payment was for an order (goods bought), reflect it on the order.
                if (payment.getOrderId() != null) {
                    markOrderPaid(payment);
                } else if (payment.getInstallmentPlanId() != null) {
                    // Pre-checkout installment down payment - no order exists yet, see
                    // initializeDownPaymentBankTransfer.
                    markDownPaymentPaid(payment);
                }
            }

            return payment;
        }

        return null;
    }

    // Raw Paystack "initialize" call with no Payment/User/Wallet entity involved — the
    // caller owns the reference and all domain bookkeeping (used by SalesService for
    // anonymous walk-in cash-sale checkouts, which have no User row to attach a
    // Payment to). Falls back to storeDefaultEmail when email is blank.
    @SuppressWarnings("unchecked")
    public Map<String, Object> initializePaystackTransaction(String email, double amount, String reference,
                                                               String callbackUrl, Map<String, Object> metadata) {
        String effectiveEmail = (email != null && !email.isBlank()) ? email : storeDefaultEmail;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("email", effectiveEmail);
        requestBody.put("amount", (int) Math.round(amount * 100));
        requestBody.put("reference", reference);
        if (callbackUrl != null && !callbackUrl.isBlank()) {
            requestBody.put("callback_url", callbackUrl);
        }
        if (metadata != null) {
            requestBody.put("metadata", metadata);
        }

        ResponseEntity<Map> response = restTemplate.postForEntity(
                paystackBaseUrl + "/transaction/initialize",
                new HttpEntity<>(requestBody, headers),
                Map.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return (Map<String, Object>) response.getBody().get("data");
        }
        return null;
    }

    // Raw Paystack "verify" call with no Payment entity lookup — unlike verifyPayment(String)
    // above, which requires a pre-existing Payment row we deliberately don't create for
    // anonymous walk-in cash sales.
    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyPaystackTransaction(String reference) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackSecretKey);

        ResponseEntity<Map> response = restTemplate.exchange(
                paystackBaseUrl + "/transaction/verify/" + reference,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return (Map<String, Object>) response.getBody().get("data");
        }
        return null;
    }

    /**
     * Entry point for Paystack's webhook. The endpoint is public, so the signature is the
     * only thing standing between a stranger and "mark any order paid": without this check
     * anyone who learns a payment reference can POST a charge.success for it.
     *
     * <p>Paystack signs the raw request body with HMAC-SHA512 keyed on the secret key and
     * sends the hex digest in {@code x-paystack-signature}. An unsigned or mis-signed call
     * is ignored (and still answered 200 - a webhook must never look retryable to Paystack
     * because a forgery failed).
     */
    public void handleWebhook(String rawPayload, String signature) {
        if (verifyWebhookSignature && !hasValidPaystackSignature(rawPayload, signature)) {
            System.err.println("Rejected webhook with missing/invalid x-paystack-signature");
            return;
        }
        try {
            Map<String, Object> payload = webhookMapper.readValue(rawPayload, Map.class);
            handleWebhook(payload);
        } catch (Exception e) {
            System.err.println("Webhook payload could not be parsed: " + e.getMessage());
        }
    }

    private boolean hasValidPaystackSignature(String rawPayload, String signature) {
        if (rawPayload == null || signature == null || signature.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(paystackSecretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] digest = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            StringBuilder expected = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                expected.append(String.format("%02x", b));
            }
            // Constant-time compare so a forger cannot tune a signature byte by byte.
            return MessageDigest.isEqual(
                    expected.toString().getBytes(StandardCharsets.UTF_8),
                    signature.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            System.err.println("Webhook signature check failed: " + e.getMessage());
            return false;
        }
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        try {
            String event = (String) payload.get("event");

            if ("charge.success".equals(event)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                String reference = (String) data.get("reference");
                Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");

                // Cashier wallet funding has no Payment row — it is tracked separately and
                // credits the target walk-in customer wallet.
                if (metadata != null && "CASHIER_WALLET_FUNDING".equals(metadata.get("type"))) {
                    handleCashierFundingSuccess(reference, data);
                    return;
                }

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

                    // See doVerifyPayment: an unlinked payment is a wallet top-up, never a
                    // purchase, so nothing is adopted onto an order or a plan here.
                    // If this payment was for an order (goods bought), mark the order paid.
                    if (payment.getOrderId() != null) {
                        markOrderPaid(payment);
                    } else if (payment.getInstallmentPlanId() != null) {
                        // Pre-checkout installment down payment - no order exists yet,
                        // see initializeDownPaymentBankTransfer.
                        markDownPaymentPaid(payment);
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't throw - webhooks should always return 200
            System.err.println("Webhook processing error: " + e.getMessage());
        }
    }

    /**
     * The delivery fee to charge in full alongside an installment plan's pre-checkout
     * down payment (see {@link #initializeDownPaymentBankTransfer}/
     * {@link #initializeDownPaymentCard}). Delivery is never financed across the plan's
     * installments, and this flow makes no later charge, so whatever isn't included here
     * is simply never collected - hence four sources, tried in order:
     *
     * <ol>
     *   <li>dto's own delivery destination - a fresh quote priced server-side from the
     *       cart (DeliveryFeeQuoteService), never taken from the request. First because it
     *       describes the destination the customer is paying for right now.</li>
     *   <li>the fee already quoted onto the plan when it was built
     *       (InstallmentService.buildPlan, from the delivery destination sent to
     *       POST /api/installments) - the authoritative, persisted figure, and the same
     *       one the customer was shown as this plan's firstPaymentAmount.</li>
     *   <li>the fee this user was quoted moments earlier via
     *       POST /orders/calculate-delivery-fee, recovered from DeliveryFeeQuoteService's
     *       short-TTL cache. Callers that omit fulfillmentType (the mobile app, which
     *       quotes delivery on the checkout screen but doesn't carry that quote into the
     *       down-payment call) used to charge 0 here and leave the fee uncollected
     *       forever.</li>
     *   <li>the fee an earlier, still-uncompleted down-payment attempt for this same plan
     *       already priced - see {@link #previouslyQuotedDeliveryFee}. The cache entry
     *       above is single-use, so without this a customer who abandons Paystack and
     *       retries would be charged a down payment with no delivery fee in it.</li>
     * </ol>
     *
     * A PICKUP fulfillmentType yields 0 - correctly, there's no trip to price - and so
     * does a cart/plan for which no delivery was ever quoted. OrderService.checkout()
     * still reconciles what was collected here against the order's real delivery fee once
     * the true destination is known (refunding an over-collection).
     */
    private java.math.BigDecimal resolveDownPaymentDeliveryFee(InstallmentPlan plan, InitializeDownPaymentDto dto) {
        if (dto.getFulfillmentType() != null) {
            return deliveryFeeQuoteService.quoteDeliveryFee(
                    dto.getUserId(), dto.getFulfillmentType(), dto.getDeliveryAddress(),
                    dto.getDeliveryStateId(), dto.getDeliveryLgaId(), dto.getDeliveryCountry());
        }

        if (plan.getDeliveryFee() != null && plan.getDeliveryFee() > 0) {
            return java.math.BigDecimal.valueOf(plan.getDeliveryFee());
        }

        java.util.Optional<java.math.BigDecimal> recentQuote =
                deliveryFeeQuoteService.consumeRecentDeliveryFee(dto.getUserId(), null);
        if (recentQuote.isPresent()) {
            // Honoured even when it's ZERO: DeliveryFeeQuoteService caches a PICKUP quote
            // as ZERO, which is positive evidence this customer isn't paying for delivery
            // at all - and so must win over any older attempt's fee below.
            System.out.println("Folding cached delivery fee " + recentQuote.get()
                    + " into the down payment charge for installment plan " + plan.getId()
                    + " (user " + dto.getUserId() + ") - caller sent no delivery destination.");
            return recentQuote.get();
        }

        java.math.BigDecimal previouslyQuoted = previouslyQuotedDeliveryFee(plan.getId());
        if (previouslyQuoted.compareTo(java.math.BigDecimal.ZERO) > 0) {
            System.out.println("Reusing delivery fee " + previouslyQuoted
                    + " from an earlier uncompleted down payment attempt for installment plan "
                    + plan.getId() + " (user " + dto.getUserId() + ").");
        }
        return previouslyQuoted;
    }

    /**
     * The delivery fee an earlier, still-uncompleted down-payment charge for this plan
     * already priced - 0 if there is none. COMPLETED payments are deliberately excluded:
     * a completed charge's fee is already collected (and recorded on the plan by
     * {@link #applyDownPaymentCollected}), so reusing it would charge the customer for
     * delivery twice.
     */
    private java.math.BigDecimal previouslyQuotedDeliveryFee(Long installmentPlanId) {
        if (installmentPlanId == null) {
            return java.math.BigDecimal.ZERO;
        }
        return paymentRepository.findByInstallmentPlanId(installmentPlanId).stream()
                .filter(p -> p.getStatus() != PaymentStatus.COMPLETED)
                .filter(p -> p.getDeliveryFeeAmount() != null && p.getDeliveryFeeAmount() > 0)
                .max(Comparator.comparing(Payment::getId))
                .map(p -> java.math.BigDecimal.valueOf(p.getDeliveryFeeAmount()))
                .orElse(java.math.BigDecimal.ZERO);
    }


    /**
     * Marks the order tied to a completed payment as paid and confirmed. Idempotent: a second call
     * (e.g. webhook after a manual verify) is a no-op once the order is already paid.
     */
    private void markOrderPaid(Payment payment) {
        try {
            Order order = orderRepository.findById(payment.getOrderId()).orElse(null);
            if (order == null) {
                return;
            }
            if (Boolean.TRUE.equals(order.getIsPaid())) {
                // Money collected against an order that was already settled: two attempts
                // both went through. Say so loudly - it is a refund, not a no-op.
                if (payment.getPaymentReference() != null
                        && !payment.getPaymentReference().equals(order.getPaymentReference())) {
                    System.err.println("DUPLICATE PAYMENT: order " + order.getId() + " was already paid by "
                            + order.getPaymentReference() + " but " + payment.getPaymentReference()
                            + " (amount " + payment.getAmount() + ") also completed. Needs refund review.");
                }
                return;
            }

            // Idempotency for an INSTALLMENT order, whose isPaid stays false by design (see
            // below) and so cannot act as the "already settled" flag: without this, every
            // repeat verify - and the app polls every few seconds - re-ran the whole body,
            // re-posting GL and re-accumulating the plan's collected delivery fee.
            if (payment.getPaymentReference() != null
                    && payment.getPaymentReference().equals(order.getPaymentReference())) {
                return;
            }

            // A card charge on an installment order (see initializeOrderCardPayment) is
            // only ever the up-front down payment, never the full plan - mirrors
            // OrderService.payOrderByWallet's branching so a card-paid down payment
            // doesn't incorrectly mark the whole order as fully paid off.
            boolean isInstallmentPayment = Boolean.TRUE.equals(payment.getIsInstallmentPayment());

            order.setIsPaid(!isInstallmentPayment);
            order.setPaidAt(LocalDateTime.now());
            order.setPaymentReference(payment.getPaymentReference());
            order.setOrderStatus(isInstallmentPayment ? OrderStatus.PENDING : OrderStatus.PAYMENT_CONFIRMED);
            orderRepository.save(order);

            // Dr the order branch's Paystack GL, Cr its Sales GL (online orders are Head Office).
            glPostingService.postPaystackSale(order.getBranchId(), payment.getAmount(),
                    payment.getPaymentReference(), payment.getUserId());

            // Checkout deliberately leaves the cart alone (an abandoned payment must not
            // cost the customer their basket), so settlement is what clears it. Done
            // against the repository rather than OrderService, which depends on this
            // service - injecting it back would be a dependency cycle.
            clearPaidCart(order.getUserId());

            // An order-level installment charge (see resolveOrderChargeAmount) is the down
            // payment the very first time it runs - a plan whose down payment was already
            // collected elsewhere (e.g. the pre-checkout flow) only ever gets charged its
            // delivery fee here, and applyDownPaymentCollected's own idempotency guard
            // no-ops for that case. Without this, plan.downPaymentPaid/completedInstallments
            // never updated for a down payment collected this way, permanently pinning
            // toOrderDto's paid-amount calc and the plan's own completion tracking.
            if (isInstallmentPayment && order.getInstallmentPlanId() != null) {
                installmentPlanRepository.findById(order.getInstallmentPlanId())
                        .ifPresent(plan -> applyDownPaymentCollected(plan, payment));
            }

            // Mirror onto the admin-facing SalesOrder model so it shows up on the
            // "Orderlist"/"Mark as Paid" screens, which never read the mobile Order model.
            // Uses the isolated (own-transaction, swallows-its-own-failure) variant here
            // specifically because this method is reached from the Paystack webhook, which
            // must always acknowledge with 200 regardless of mirror-sync outcome - a real
            // charge must never be rolled back just because this admin-visibility update
            // failed. See MobileSalesOrderSyncService's class javadoc.
            if (isInstallmentPayment) {
                mobileSalesOrderSyncService.syncDownPaymentCollectedIsolated(order.getId());
            } else {
                mobileSalesOrderSyncService.syncFullPaymentCollectedIsolated(order.getId());
            }
        } catch (Exception e) {
            System.err.println("Order payment update error: " + e.getMessage());
        }
    }

    /**
     * Marks an installment plan's down payment as paid once Paystack confirms a
     * payment initialized via {@link #initializeDownPaymentBankTransfer} - the plan's
     * order doesn't exist yet at this point, so there's no Order to mark paid the
     * usual way. {@code OrderService.checkout()} is responsible for reading these
     * fields back and reflecting them on the order once it's created. Idempotent: a
     * second call (e.g. webhook after a manual verify) is a no-op once already marked.
     */
    private void markDownPaymentPaid(Payment payment) {
        try {
            InstallmentPlan plan = installmentPlanRepository.findById(payment.getInstallmentPlanId()).orElse(null);
            applyDownPaymentCollected(plan, payment);
            // No order exists yet, so this online down payment belongs to Head Office.
            glPostingService.postPaystackSale(null, payment.getAmount(),
                    payment.getPaymentReference(), payment.getUserId());
        } catch (Exception e) {
            System.err.println("Down payment plan update error: " + e.getMessage());
        }
    }

    /**
     * Flags an installment plan's down payment as collected and marks the plan's
     * installment #1 row PAID - the down payment IS that period, not a charge on top of
     * it (see InstallmentService.buildPlan). Shared by every path that can collect it:
     * the pre-checkout Paystack flow ({@link #markDownPaymentPaid}), an order-level
     * Paystack charge ({@link #markOrderPaid}), and OrderService.payOrderByWallet - all
     * three can be the first (and only) charge to ever settle a plan's down payment,
     * depending on which flow the customer used. Idempotent: a plan already flagged
     * paid is left untouched, so calling this for a charge that turned out to be
     * delivery-fee-only (down payment already collected elsewhere) is always safe.
     */
    public void applyDownPaymentCollected(InstallmentPlan plan, Payment payment) {
        if (plan == null) {
            return;
        }

        // Track how much delivery fee this specific charge collected, independent of the
        // downPaymentPaid guard below - a charge that turns out to be delivery-fee-only
        // (down payment already settled by an earlier charge) still needs to be recorded,
        // or resolveOrderChargeAmount/OrderService.payOrderByWallet would think that fee
        // is still outstanding and try to collect it again. Every caller of this method is
        // already guarded upstream against charging the same order/plan twice
        // (orderPaymentAlreadyCollected, hasOrderLevelPayment, downPaymentPaid on the
        // pre-checkout flow), so accumulating here is always safe, not just idempotent.
        // ...but only ONCE per charge. This used to accumulate on every call, and since a
        // repeat verify re-entered here (markOrderPaid's isPaid guard never fires for an
        // installment order), plan.downPaymentDeliveryFee grew on each poll - inflating a
        // figure that later tells the system how much delivery was already collected.
        boolean alreadyAppliedThisCharge = payment.getPaymentReference() != null
                && payment.getPaymentReference().equals(plan.getDownPaymentReference());
        double deliveryFeeInThisPayment = payment.getDeliveryFeeAmount() != null ? payment.getDeliveryFeeAmount() : 0.0;
        if (deliveryFeeInThisPayment > 0 && !alreadyAppliedThisCharge) {
            double existingDeliveryFee = plan.getDownPaymentDeliveryFee() != null ? plan.getDownPaymentDeliveryFee() : 0.0;
            plan.setDownPaymentDeliveryFee(existingDeliveryFee + deliveryFeeInThisPayment);
            installmentPlanRepository.save(plan);
        }

        if (Boolean.TRUE.equals(plan.getDownPaymentPaid())) {
            return;
        }
        LocalDateTime paidAt = payment.getPaidAt() != null ? payment.getPaidAt() : LocalDateTime.now();
        plan.setDownPaymentPaid(true);
        plan.setDownPaymentPaidAt(paidAt);
        plan.setDownPaymentReference(payment.getPaymentReference());

        // The down payment settles the schedule's period #1 outright (see
        // InstallmentService.buildPlan) - plan.numberOfInstallments still counts it, so
        // it must count toward completedInstallments too, or a plan can never reach
        // numberOfInstallments once every remaining Installment row
        // (InstallmentService.payInstallmentInternal) is paid off. Mirrors that
        // method's early-shipment/completion bookkeeping for the same reason.
        plan.setCompletedInstallments(plan.getCompletedInstallments() + 1);
        if (plan.getCompletedInstallments() >= 2) {
            plan.setEarlyShipmentEligible(true);
        }
        if (plan.getCompletedInstallments().equals(plan.getNumberOfInstallments())) {
            plan.setStatus(InstallmentStatus.COMPLETED);
            plan.setCompletionDate(LocalDate.now());
        }

        installmentPlanRepository.save(plan);

        // A single-period plan (MONTHLY, 1 month) is settled outright by its down payment:
        // no Installment row is left, so InstallmentService.payInstallmentInternal - which
        // normally marks the order paid on the final installment - can never run for it.
        // Without this the customer pays in full and the order sits "awaiting payment"
        // forever, with both repayment endpoints refusing to help.
        if (plan.getStatus() == InstallmentStatus.COMPLETED) {
            markPlanOrderFullyPaid(plan, payment);
        }

        installmentRepository.findByInstallmentPlanIdAndInstallmentNumber(plan.getId(), 1)
                .ifPresent(firstInstallment -> {
                    firstInstallment.setStatus(InstallmentStatus.PAID);
                    firstInstallment.setAmountPaid(firstInstallment.getAmountDue());
                    firstInstallment.setPaidDate(paidAt.toLocalDate());
                    firstInstallment.setPaymentId(payment.getId());
                    installmentRepository.save(firstInstallment);
                });
    }

    private void creditWalletAfterPayment(Long userId, Double amount, String reference) {
        try {
            // The verify endpoint credits the same payment (WalletService.verifyAndFundWallet)
            // and the app calls it while this webhook is in flight. The funding credit is
            // recorded under a reference derived from the payment reference, and that column
            // is unique, so checking for it here is what stops a double credit.
            String fundingReference = WalletService.fundingTransactionReference(reference);
            if (transactionRepository.findByTransactionReference(fundingReference).isPresent()) {
                System.out.println("Wallet funding " + reference + " already credited - skipping");
                return;
            }

            // Get or create wallet
            Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> new RuntimeException("Wallet not found for user: " + userId));

            Double balanceBefore = wallet.getBalance();
            wallet.setBalance(balanceBefore + amount);
            walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = new Transaction();
            transaction.setUserId(userId);
            transaction.setTransactionReference(fundingReference);
            transaction.setType(TransactionType.CREDIT);
            transaction.setAmount(amount);
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(wallet.getBalance());
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription("Wallet funded via Paystack - Ref: " + reference);
            transaction.setTransactionDate(LocalDateTime.now());
            transactionRepository.save(transaction);

            glPostingService.postWalletFunding(amount, reference, userId);

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
            payment.setPaymentMethod(PaymentMethod.CARD); // Card payment for wallet funding
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
            requestBody.put("channels", new String[]{"card"}); // ✅ Restrict to CARD only
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
            e.printStackTrace(); // Log full stack trace for debugging
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Wallet funding initialization error: " + e.getMessage())
                    .build();
        }
    }

    // ---------------------------------------------------------------------------------------
    // Cashier wallet funding via Paystack bank transfer (credits a walk-in customer by account)
    // ---------------------------------------------------------------------------------------

    /**
     * Starts a Paystack payment to fund a walk-in customer's wallet. Records the target
     * customer (account number / customer id) in a {@link com.appGate.account.models.CashierWalletFunding}
     * so verify/webhook can credit the right wallet. {@code dto.paymentChannel} of "CARD" or
     * "BANK_TRANSFER" restricts the hosted checkout to that channel; left blank, Paystack
     * shows the customer all available payment options.
     */
    @Transactional
    public BaseResponse initializeCashierBankTransfer(com.appGate.account.dto.InitializeCashierTransferDto dto) {
        try {
            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Enter a valid funding amount")
                        .build();
            }
            boolean hasAccount = dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank();
            if (!hasAccount && dto.getCustomerId() == null) {
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Select a customer to fund before starting a transfer")
                        .build();
            }

            String reference = generatePaymentReference();
            boolean isCardChannel = "CARD".equalsIgnoreCase(dto.getPaymentChannel());
            boolean isBankTransferChannel = "BANK_TRANSFER".equalsIgnoreCase(dto.getPaymentChannel());

            com.appGate.account.models.CashierWalletFunding funding =
                    new com.appGate.account.models.CashierWalletFunding();
            funding.setPaymentReference(reference);
            funding.setAccountNumber(dto.getAccountNumber());
            funding.setCustomerId(dto.getCustomerId());
            funding.setAmount(dto.getAmount());
            funding.setCustomerName(dto.getCustomerName());
            funding.setEnteredBy(dto.getEnteredBy());
            funding.setDescription(dto.getDescription());
            funding.setMethod(isCardChannel ? "CARD" : "BANK_TRANSFER");
            funding.setStatus("PENDING");
            cashierWalletFundingRepository.save(funding);

            String email = (dto.getEmail() != null && !dto.getEmail().isBlank())
                    ? dto.getEmail() : storeDefaultEmail;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            requestBody.put("amount", (int) (dto.getAmount() * 100)); // Paystack uses kobo
            requestBody.put("reference", reference);
            if (dto.getCallbackUrl() != null && !dto.getCallbackUrl().isBlank()) {
                requestBody.put("callback_url", dto.getCallbackUrl());
            }
            if (isCardChannel) {
                requestBody.put("channels", new String[]{"card"});
            } else if (isBankTransferChannel) {
                requestBody.put("channels", new String[]{"bank_transfer"});
            }
            // Otherwise (paymentChannel blank, e.g. the dedicated bank-transfer-only caller)
            // leave channels unset so Paystack shows every channel it supports.
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "CASHIER_WALLET_FUNDING");
            metadata.put("reference", reference);
            if (dto.getAccountNumber() != null) metadata.put("accountNumber", dto.getAccountNumber());
            if (dto.getCustomerId() != null) metadata.put("customerId", dto.getCustomerId());
            requestBody.put("metadata", metadata);

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
                result.put("paymentReference", reference);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));

                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Bank transfer funding initialized successfully")
                        .data(result)
                        .build();
            } else {
                funding.setStatus("FAILED");
                cashierWalletFundingRepository.save(funding);
                return BaseResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Failed to initialize bank transfer funding")
                        .build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Bank transfer initialization error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Verifies a cashier wallet funding on return from Paystack and credits the target wallet.
     * Idempotent: a funding already marked COMPLETED is not credited twice.
     */
    @Transactional
    public BaseResponse verifyCashierWalletFunding(String reference) {
        try {
            com.appGate.account.models.CashierWalletFunding funding =
                    cashierWalletFundingRepository.findByPaymentReference(reference).orElse(null);
            if (funding == null) {
                return BaseResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Funding record not found")
                        .build();
            }
            if ("COMPLETED".equals(funding.getStatus())) {
                return cashierFundingSuccessResponse(funding);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);

            ResponseEntity<Map> response = restTemplate.exchange(
                    paystackBaseUrl + "/transaction/verify/" + reference,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                String status = data != null ? (String) data.get("status") : null;

                if ("success".equals(status)) {
                    handleCashierFundingSuccess(reference, data);
                    return cashierFundingSuccessResponse(funding);
                } else {
                    funding.setStatus("FAILED");
                    cashierWalletFundingRepository.save(funding);
                    return BaseResponse.builder()
                            .status(HttpStatus.BAD_REQUEST.value())
                            .message("Payment was not successful")
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

    /**
     * Funds a customer wallet by charging a company card through Paystack. On the card's first
     * use it isn't tokenized yet, so an {@code authorizationUrl} is returned for the operator to
     * enter the card once (the wallet is credited on the callback). Afterwards the saved
     * authorization is charged instantly (server-to-server) and the wallet is credited here.
     */
    @Transactional
    public BaseResponse fundWalletByCompanyCard(com.appGate.account.dto.FundByCardDto dto) {
        try {
            if (dto.getAmount() == null || dto.getAmount() <= 0) {
                return badRequest("Enter a valid funding amount");
            }
            boolean hasAccount = dto.getAccountNumber() != null && !dto.getAccountNumber().isBlank();
            if (!hasAccount && dto.getCustomerId() == null) {
                return badRequest("Select a customer to fund before charging a card");
            }
            Long cardId = parseLongOrNull(dto.getCompanyCardId());
            if (cardId == null) {
                return badRequest("Select a company card to charge");
            }
            com.appGate.account.models.CompanyCard card =
                    companyCardRepository.findById(cardId).orElse(null);
            if (card == null) {
                return badRequest("Company card not found");
            }

            String reference = generatePaymentReference();
            String email = (card.getEmail() != null && !card.getEmail().isBlank())
                    ? card.getEmail() : storeDefaultEmail;

            com.appGate.account.models.CashierWalletFunding funding =
                    new com.appGate.account.models.CashierWalletFunding();
            funding.setPaymentReference(reference);
            funding.setAccountNumber(dto.getAccountNumber());
            funding.setCustomerId(dto.getCustomerId());
            funding.setAmount(dto.getAmount());
            funding.setCustomerName(dto.getCustomerName());
            funding.setEnteredBy(dto.getEnteredBy());
            funding.setDescription(dto.getDescription());
            funding.setMethod("CARD");
            funding.setCompanyCardId(cardId);
            funding.setStatus("PENDING");
            cashierWalletFundingRepository.save(funding);

            // Card already tokenized -> charge instantly, no redirect.
            if (card.getAuthorizationCode() != null && !card.getAuthorizationCode().isBlank()) {
                Map<String, Object> chargeData =
                        chargeAuthorization(card.getAuthorizationCode(), email, dto.getAmount(), reference);
                String status = chargeData != null ? (String) chargeData.get("status") : null;
                if (!"success".equals(status)) {
                    funding.setStatus("FAILED");
                    cashierWalletFundingRepository.save(funding);
                    String msg = chargeData != null && chargeData.get("gateway_response") != null
                            ? String.valueOf(chargeData.get("gateway_response"))
                            : "Card charge was not successful";
                    return badRequest(msg);
                }
                handleCashierFundingSuccess(reference, chargeData);
                return cashierFundingSuccessResponse(
                        cashierWalletFundingRepository.findByPaymentReference(reference).orElse(funding));
            }

            // Not tokenized yet -> send the operator to Paystack to enter the card once.
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + paystackSecretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("email", email);
            requestBody.put("amount", (int) (dto.getAmount() * 100));
            requestBody.put("reference", reference);
            if (dto.getCallbackUrl() != null && !dto.getCallbackUrl().isBlank()) {
                requestBody.put("callback_url", dto.getCallbackUrl());
            }
            requestBody.put("channels", new String[]{"card"});
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "CASHIER_WALLET_FUNDING");
            metadata.put("reference", reference);
            metadata.put("companyCardId", cardId);
            if (dto.getAccountNumber() != null) metadata.put("accountNumber", dto.getAccountNumber());
            if (dto.getCustomerId() != null) metadata.put("customerId", dto.getCustomerId());
            requestBody.put("metadata", metadata);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    paystackBaseUrl + "/transaction/initialize",
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                Map<String, Object> result = new HashMap<>();
                result.put("paymentReference", reference);
                result.put("authorizationUrl", data.get("authorization_url"));
                result.put("accessCode", data.get("access_code"));
                return BaseResponse.builder()
                        .status(HttpStatus.OK.value())
                        .message("Card setup initialized — complete it on Paystack to save the card")
                        .data(result)
                        .build();
            }

            funding.setStatus("FAILED");
            cashierWalletFundingRepository.save(funding);
            return badRequest("Failed to initialize card payment");
        } catch (Exception e) {
            e.printStackTrace();
            return BaseResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Card funding error: " + e.getMessage())
                    .build();
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> chargeAuthorization(String authorizationCode, String email,
                                                    Double amount, String reference) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + paystackSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("authorization_code", authorizationCode);
        body.put("email", email);
        body.put("amount", (int) (amount * 100));
        body.put("reference", reference);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                paystackBaseUrl + "/transaction/charge_authorization",
                new HttpEntity<>(body, headers),
                Map.class
        );
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return (Map<String, Object>) response.getBody().get("data");
        }
        return null;
    }

    private BaseResponse badRequest(String message) {
        return BaseResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message(message)
                .build();
    }

    private Long parseLongOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Idempotently completes a cashier funding after a successful Paystack payment: captures the
     * card authorization (so a company card can be charged instantly next time), credits the
     * target wallet, and marks the funding COMPLETED. {@code paystackData} is the Paystack
     * transaction "data" object (from verify or webhook), which carries the authorization.
     */
    private void handleCashierFundingSuccess(String reference, Map<String, Object> paystackData) {
        com.appGate.account.models.CashierWalletFunding funding =
                cashierWalletFundingRepository.findByPaymentReference(reference).orElse(null);
        if (funding == null || "COMPLETED".equals(funding.getStatus())) {
            return;
        }
        if (funding.getCompanyCardId() != null && paystackData != null) {
            captureCardAuthorization(funding.getCompanyCardId(), paystackData);
        }
        creditWalletForFunding(funding);
        funding.setStatus("COMPLETED");
        cashierWalletFundingRepository.save(funding);
        glPostingService.postWalletFunding(funding.getAmount(), reference, funding.getCustomerId());
    }

    // Stores the reusable Paystack authorization (and card details) on the company card so future
    // fundings with that card can be charged instantly via charge_authorization.
    @SuppressWarnings("unchecked")
    private void captureCardAuthorization(Long companyCardId, Map<String, Object> paystackData) {
        try {
            Object authObj = paystackData.get("authorization");
            if (!(authObj instanceof Map)) {
                return;
            }
            Map<String, Object> auth = (Map<String, Object>) authObj;
            String authorizationCode = (String) auth.get("authorization_code");
            if (authorizationCode == null || authorizationCode.isBlank()) {
                return;
            }
            companyCardRepository.findById(companyCardId).ifPresent(card -> {
                card.setAuthorizationCode(authorizationCode);
                if (auth.get("brand") != null) card.setBrand(String.valueOf(auth.get("brand")));
                if (auth.get("last4") != null) card.setLast4(String.valueOf(auth.get("last4")));
                if (auth.get("exp_month") != null) card.setExpMonth(String.valueOf(auth.get("exp_month")));
                if (auth.get("exp_year") != null) card.setExpYear(String.valueOf(auth.get("exp_year")));
                if (auth.get("bank") != null && (card.getBankName() == null || card.getBankName().isBlank())) {
                    card.setBankName(String.valueOf(auth.get("bank")));
                }
                companyCardRepository.save(card);
            });
        } catch (Exception e) {
            System.err.println("Company card authorization capture error: " + e.getMessage());
        }
    }

    // Resolves the target wallet by customerId then account number (auto-provisions one on first
    // funding), credits it, and records a CREDIT transaction tagged with the funding method.
    private void creditWalletForFunding(com.appGate.account.models.CashierWalletFunding funding) {
        Wallet wallet = null;
        if (funding.getCustomerId() != null) {
            wallet = walletRepository.findByCustomerId(funding.getCustomerId()).orElse(null);
        }
        if (wallet == null && funding.getAccountNumber() != null && !funding.getAccountNumber().isBlank()) {
            wallet = walletRepository.findByAccountNumber(funding.getAccountNumber()).orElse(null);
        }
        if (wallet == null) {
            wallet = new Wallet();
            wallet.setCustomerId(funding.getCustomerId());
            wallet.setAccountNumber(funding.getAccountNumber());
            wallet.setBalance(0.0);
            wallet.setCurrency("NGN");
            wallet.setIsActive(true);
            wallet = walletRepository.save(wallet);
        }

        Double balanceBefore = wallet.getBalance();
        Double balanceAfter = balanceBefore + funding.getAmount();
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        boolean isCard = "CARD".equalsIgnoreCase(funding.getMethod());
        String methodLabel = isCard ? "card" : "bank transfer";

        Long txUserId = wallet.getUserId() != null ? wallet.getUserId() : wallet.getCustomerId();
        if (txUserId != null) {
            Transaction transaction = new Transaction();
            transaction.setUserId(txUserId);
            transaction.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            transaction.setType(TransactionType.CREDIT);
            transaction.setAmount(funding.getAmount());
            transaction.setBalanceBefore(balanceBefore);
            transaction.setBalanceAfter(balanceAfter);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription(funding.getDescription() != null && !funding.getDescription().isBlank()
                    ? funding.getDescription()
                    : "Wallet funding via " + methodLabel
                    + (funding.getEnteredBy() != null ? " (" + funding.getEnteredBy() + ")" : ""));
            transaction.setNarration(buildFundingNarration(funding, isCard));
            transaction.setRecipientAccountNumber(wallet.getAccountNumber());
            transaction.setTransactionDate(LocalDateTime.now());
            transactionRepository.save(transaction);
        }
    }

    // Records how the wallet was funded on the ledger. For card fundings the company card that
    // was debited (its name) is included alongside the Paystack charge reference.
    private String buildFundingNarration(com.appGate.account.models.CashierWalletFunding funding, boolean isCard) {
        if (isCard) {
            String cardName = funding.getCompanyCardId() != null
                    ? companyCardRepository.findById(funding.getCompanyCardId())
                        .map(com.appGate.account.models.CompanyCard::getCardName).orElse(null)
                    : null;
            return "CARD" + (cardName != null && !cardName.isBlank() ? " - " + cardName : "")
                    + " - Paystack: " + funding.getPaymentReference();
        }
        return "BANK_TRANSFER - Ref: " + funding.getPaymentReference();
    }

    private BaseResponse cashierFundingSuccessResponse(com.appGate.account.models.CashierWalletFunding funding) {
        Double balance = null;
        Wallet wallet = null;
        if (funding.getCustomerId() != null) {
            wallet = walletRepository.findByCustomerId(funding.getCustomerId()).orElse(null);
        }
        if (wallet == null && funding.getAccountNumber() != null) {
            wallet = walletRepository.findByAccountNumber(funding.getAccountNumber()).orElse(null);
        }
        if (wallet != null) {
            balance = wallet.getBalance();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("status", "success");
        data.put("reference", funding.getPaymentReference());
        data.put("amount", funding.getAmount());
        data.put("accountNumber", funding.getAccountNumber());
        if (balance != null) {
            data.put("walletBalance", balance);
        }

        return BaseResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Wallet funded successfully")
                .data(data)
                .build();
    }

    /**
     * Whether a Paystack transaction status is a settled failure, as opposed to a charge
     * still in flight. Only "failed" and "reversed" are terminal; "abandoned", "ongoing",
     * "pending", "processing" and "queued" can all still turn into a success, so they
     * leave the payment PENDING for the next verify or the webhook to resolve.
     */
    private boolean isFinalPaystackFailure(String paystackStatus) {
        return "failed".equalsIgnoreCase(paystackStatus) || "reversed".equalsIgnoreCase(paystackStatus);
    }

    /**
     * Marks a plan's order fully paid once the plan itself is settled, mirroring
     * {@code InstallmentService.payInstallmentInternal}'s final-installment block. Only
     * reached when the down payment alone completes the plan (a one-period plan).
     */
    private void markPlanOrderFullyPaid(InstallmentPlan plan, Payment payment) {
        Long orderId = plan.getOrderId() != null ? plan.getOrderId() : payment.getOrderId();
        if (orderId == null) {
            return;
        }
        orderRepository.findById(orderId).ifPresent(order -> {
            if (Boolean.TRUE.equals(order.getIsPaid())) {
                return;
            }
            order.setIsPaid(true);
            order.setPaidAt(order.getPaidAt() != null ? order.getPaidAt() : LocalDateTime.now());
            order.setOrderStatus(OrderStatus.PAYMENT_CONFIRMED);
            orderRepository.save(order);
            mobileSalesOrderSyncService.syncFullPaymentCollectedIsolated(order.getId());
        });
    }

    /** Empties the customer's active cart once their order is paid. Safe to call twice. */
    private void clearPaidCart(Long userId) {
        if (userId == null) {
            return;
        }
        try {
            List<com.appGate.orderingsales.models.Cart> activeItems =
                    cartRepository.findByUserIdAndStatus(userId, true);
            if (activeItems.isEmpty()) {
                return;
            }
            activeItems.forEach(item -> item.setStatus(false));
            cartRepository.saveAll(activeItems);
        } catch (Exception e) {
            System.err.println("Could not clear cart for user " + userId + ": " + e.getMessage());
        }
    }

    private String generatePaymentReference() {
        return "PM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

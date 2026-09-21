package com.appGate.account.repository;

import com.appGate.account.enums.PaymentStatus;
import com.appGate.account.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    List<Payment> findByUserId(Long userId);

    List<Payment> findByUserIdAndStatus(Long userId, PaymentStatus status);

    List<Payment> findByOrderId(Long orderId);

    // Every charge ever initialized against an installment plan's pre-checkout down
    // payment (Payment.installmentPlanId) - including PENDING attempts the customer
    // abandoned at Paystack. Read by PaymentGatewayService.previouslyQuotedDeliveryFee
    // to recover the delivery fee an earlier attempt already priced.
    List<Payment> findByInstallmentPlanId(Long installmentPlanId);

    Optional<Payment> findByInstallmentId(Long installmentId);
}

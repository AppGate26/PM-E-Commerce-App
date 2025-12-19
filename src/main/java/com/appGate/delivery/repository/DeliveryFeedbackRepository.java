package com.appGate.delivery.repository;

import com.appGate.delivery.models.DeliveryFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryFeedbackRepository extends JpaRepository<DeliveryFeedback, Long> {
    Optional<DeliveryFeedback> findByRiderBoxId(Long riderBoxId);
    Optional<DeliveryFeedback> findByDeliveryConfirmationId(Long deliveryConfirmationId);
}

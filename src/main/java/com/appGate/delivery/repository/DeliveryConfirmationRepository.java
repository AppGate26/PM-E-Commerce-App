package com.appGate.delivery.repository;

import com.appGate.delivery.models.DeliveryConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryConfirmationRepository extends JpaRepository<DeliveryConfirmation, Long> {
    Optional<DeliveryConfirmation> findByRiderBoxId(Long riderBoxId);
}

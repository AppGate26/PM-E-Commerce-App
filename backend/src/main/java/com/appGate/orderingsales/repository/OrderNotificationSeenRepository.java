package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.models.OrderNotificationSeen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderNotificationSeenRepository extends JpaRepository<OrderNotificationSeen, Long> {

    Optional<OrderNotificationSeen> findByUserId(Long userId);
}

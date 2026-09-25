package com.appGate.delivery.repository;

import com.appGate.delivery.models.DeliveryNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryNotificationRepository extends JpaRepository<DeliveryNotification, Long> {
    Page<DeliveryNotification> findAllByOrderByNotificationDateDesc(Pageable pageable);
    List<DeliveryNotification> findByRiderIdOrderByNotificationDateDesc(Long riderId);
    Page<DeliveryNotification> findByRiderIdOrderByNotificationDateDesc(Long riderId, Pageable pageable);
    long countByRiderIdAndIsReadFalse(Long riderId);
    List<DeliveryNotification> findByRiderIdAndIsReadFalse(Long riderId);
    List<DeliveryNotification> findByIsReadOrderByNotificationDateDesc(Boolean isRead);

    Page<DeliveryNotification> findByBranchIdOrderByNotificationDateDesc(Long branchId, Pageable pageable);
}

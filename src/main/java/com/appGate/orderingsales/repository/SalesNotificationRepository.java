package com.appGate.orderingsales.repository;

import com.appGate.orderingsales.enums.NotificationType;
import com.appGate.orderingsales.models.SalesNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalesNotificationRepository extends JpaRepository<SalesNotification, Long> {

    Page<SalesNotification> findByNotificationType(NotificationType notificationType, Pageable pageable);

    List<SalesNotification> findByNotificationTypeAndIsActionedFalse(NotificationType notificationType);

    Page<SalesNotification> findByIsReadFalse(Pageable pageable);

    Long countByNotificationTypeAndIsReadFalse(NotificationType notificationType);
}

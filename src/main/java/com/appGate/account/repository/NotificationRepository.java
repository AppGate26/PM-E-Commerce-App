package com.appGate.account.repository;

import com.appGate.account.enums.NotificationStatus;
import com.appGate.account.enums.NotificationType;
import com.appGate.account.models.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {

    Page<Notification> findByUserId(Long userId, Pageable pageable);

    Page<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status, Pageable pageable);

    Page<Notification> findByUserIdAndType(Long userId, NotificationType type, Pageable pageable);

    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);

    Long countByUserIdAndStatus(Long userId, NotificationStatus status);

    List<Notification> findByUserIdAndCreatedAtAfter(Long userId, LocalDateTime dateTime);

    @Modifying
    @Query("UPDATE Notification n SET n.status = :status WHERE n.userId = :userId AND n.status = :currentStatus")
    void updateStatusByUserIdAndCurrentStatus(Long userId, NotificationStatus currentStatus, NotificationStatus status);

    @Modifying
    @Query("UPDATE Notification n SET n.status = :status, n.readAt = :readAt WHERE n.id = :notificationId")
    void markAsRead(Long notificationId, NotificationStatus status, LocalDateTime readAt);
}

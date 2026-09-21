package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.models.LoanNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanNotificationRepository extends JpaRepository<LoanNotification, Long> {
    List<LoanNotification> findByCustomerId(Long customerId);
    List<LoanNotification> findByCustomerIdOrderByNotificationDateDesc(Long customerId);
    List<LoanNotification> findByIsSent(Boolean isSent);
    List<LoanNotification> findByIsRead(Boolean isRead);
    List<LoanNotification> findByNotificationType(String notificationType);

    List<LoanNotification> findByBranchId(Long branchId);
    List<LoanNotification> findByIsSentAndBranchId(Boolean isSent, Long branchId);
    List<LoanNotification> findByNotificationTypeAndBranchId(String notificationType, Long branchId);
}

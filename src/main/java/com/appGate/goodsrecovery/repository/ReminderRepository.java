package com.appGate.goodsrecovery.repository;

import com.appGate.goodsrecovery.enums.RecipientType;
import com.appGate.goodsrecovery.enums.ReminderType;
import com.appGate.goodsrecovery.models.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByRecipientIdAndRecipientTypeOrderByScheduledDateDesc(Long recipientId, RecipientType recipientType);

    List<Reminder> findByRecipientTypeOrderByScheduledDateDesc(RecipientType recipientType);

    List<Reminder> findByIsSentOrderByScheduledDateDesc(Boolean isSent);

    List<Reminder> findByReminderTypeAndIsSentOrderByScheduledDateDesc(ReminderType reminderType, Boolean isSent);

    List<Reminder> findByScheduledDateBeforeAndIsSent(LocalDateTime dateTime, Boolean isSent);

    List<Reminder> findByRelatedEntityTypeAndRelatedEntityIdOrderByScheduledDateDesc(
            com.appGate.goodsrecovery.enums.RelatedEntityType relatedEntityType,
            Long relatedEntityId
    );
}

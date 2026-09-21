package com.appGate.messenger.repository;

import com.appGate.messenger.models.MessengerMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessengerMessageRepository extends JpaRepository<MessengerMessage, Long> {

    List<MessengerMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);

    Page<MessengerMessage> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    @Query("SELECT m FROM MessengerMessage m WHERE m.conversation.id = :conversationId ORDER BY m.sentAt DESC")
    List<MessengerMessage> findRecentMessages(@Param("conversationId") Long conversationId, Pageable pageable);

    @Modifying
    @Query("UPDATE MessengerMessage m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.recipient.id = :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    Long countByRecipientIdAndIsReadFalse(Long recipientId);
}

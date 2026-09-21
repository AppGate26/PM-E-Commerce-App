package com.appGate.mail.repository;

import com.appGate.mail.models.InternalMail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InternalMailRepository extends JpaRepository<InternalMail, Long> {

    // Inbox - messages received by user
    Page<InternalMail> findByRecipientIdAndIsDeletedByRecipientFalseOrderBySentAtDesc(Long recipientId, Pageable pageable);

    List<InternalMail> findByRecipientIdAndIsDeletedByRecipientFalseOrderBySentAtDesc(Long recipientId);

    // Sent - messages sent by user
    Page<InternalMail> findBySenderIdAndIsDeletedBySenderFalseOrderBySentAtDesc(Long senderId, Pageable pageable);

    List<InternalMail> findBySenderIdAndIsDeletedBySenderFalseOrderBySentAtDesc(Long senderId);

    // Count unread messages
    Long countByRecipientIdAndIsReadFalseAndIsDeletedByRecipientFalse(Long recipientId);
}

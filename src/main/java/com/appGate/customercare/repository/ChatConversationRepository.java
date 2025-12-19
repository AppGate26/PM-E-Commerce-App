package com.appGate.customercare.repository;

import com.appGate.customercare.enums.ChatStatus;
import com.appGate.customercare.models.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByStatus(ChatStatus status);

    Long countByStatus(ChatStatus status);

    List<ChatConversation> findByUserId(Long userId);
}

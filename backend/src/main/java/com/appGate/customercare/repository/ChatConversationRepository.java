package com.appGate.customercare.repository;

import com.appGate.customercare.enums.ChatStatus;
import com.appGate.customercare.models.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByStatus(ChatStatus status);

    Long countByStatus(ChatStatus status);

    List<ChatConversation> findByUserId(Long userId);

    List<ChatConversation> findByStatusAndBranchId(ChatStatus status, Long branchId);

    Long countByStatusAndBranchId(ChatStatus status, Long branchId);

    /** The signed-in customer's own conversation, so each user is routed to their own thread. */
    Optional<ChatConversation> findFirstByUserIdAndStatusOrderByLastMessageAtDesc(Long userId, ChatStatus status);
}

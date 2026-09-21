package com.appGate.messenger.repository;

import com.appGate.messenger.models.MessengerConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessengerConversationRepository extends JpaRepository<MessengerConversation, Long> {

    @Query("SELECT c FROM MessengerConversation c WHERE c.userOne.id = :userId OR c.userTwo.id = :userId ORDER BY c.lastMessageAt DESC")
    List<MessengerConversation> findConversationsByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM MessengerConversation c WHERE (c.userOne.id = :userOneId AND c.userTwo.id = :userTwoId) OR (c.userOne.id = :userTwoId AND c.userTwo.id = :userOneId)")
    Optional<MessengerConversation> findConversationBetweenUsers(@Param("userOneId") Long userOneId, @Param("userTwoId") Long userTwoId);
}

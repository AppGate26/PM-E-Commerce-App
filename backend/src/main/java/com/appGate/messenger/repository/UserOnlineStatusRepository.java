package com.appGate.messenger.repository;

import com.appGate.messenger.models.UserOnlineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserOnlineStatusRepository extends JpaRepository<UserOnlineStatus, Long> {

    Optional<UserOnlineStatus> findByUserId(Long userId);

    List<UserOnlineStatus> findByIsOnlineTrue();

    @Query("SELECT u FROM UserOnlineStatus u WHERE u.lastSeen >= :since")
    List<UserOnlineStatus> findRecentlyActive(LocalDateTime since);
}

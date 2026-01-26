package com.appGate.rbac.repository;

import com.appGate.rbac.models.UserLogTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLogTrailRepository extends JpaRepository<UserLogTrail, Long> {

    Page<UserLogTrail> findByUserId(Long userId, Pageable pageable);

    Page<UserLogTrail> findByUserIdAndActivity(Long userId, String activity, Pageable pageable);

    // For security module - get all log trails
    Page<UserLogTrail> findAllByOrderByDateDescTimeInDesc(Pageable pageable);

    // Get active sessions
    List<UserLogTrail> findBySessionActiveTrueOrderByDateDescTimeInDesc();

    // Get active session for a specific user
    List<UserLogTrail> findByUserIdAndSessionActiveTrue(Long userId);

    // Force logout by updating session to inactive
    @Modifying
    @Query("UPDATE UserLogTrail u SET u.sessionActive = false, u.timeOut = CURRENT_TIME WHERE u.id = :logId")
    void forceLogout(@Param("logId") Long logId);

    // Force logout all sessions for a user
    @Modifying
    @Query("UPDATE UserLogTrail u SET u.sessionActive = false, u.timeOut = CURRENT_TIME WHERE u.userId = :userId AND u.sessionActive = true")
    void forceLogoutAllSessions(@Param("userId") Long userId);
}

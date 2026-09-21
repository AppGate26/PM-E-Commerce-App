package com.appGate.rbac.repository;

import com.appGate.rbac.models.UserSecurityQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSecurityQuestionRepository extends JpaRepository<UserSecurityQuestion, Long> {
    Optional<UserSecurityQuestion> findByUserId(Long userId);
}

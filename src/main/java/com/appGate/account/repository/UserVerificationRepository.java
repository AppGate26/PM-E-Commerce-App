package com.appGate.account.repository;

import com.appGate.account.enums.VerificationStatus;
import com.appGate.account.enums.VerificationType;
import com.appGate.account.models.UserVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVerificationRepository extends JpaRepository<UserVerification, Long>, JpaSpecificationExecutor<UserVerification> {

    Optional<UserVerification> findByUserIdAndVerificationType(Long userId, VerificationType verificationType);

    List<UserVerification> findByUserId(Long userId);

    List<UserVerification> findByUserIdAndStatus(Long userId, VerificationStatus status);

    Optional<UserVerification> findByVerificationReference(String verificationReference);

    boolean existsByUserIdAndVerificationTypeAndStatus(Long userId, VerificationType verificationType, VerificationStatus status);

    boolean existsByUserId(Long userId);
}

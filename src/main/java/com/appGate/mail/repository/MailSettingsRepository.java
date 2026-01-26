package com.appGate.mail.repository;

import com.appGate.mail.models.MailSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MailSettingsRepository extends JpaRepository<MailSettings, Long> {
    Optional<MailSettings> findByUserId(Long userId);
}

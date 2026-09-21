package com.appGate.rbac.service;

import com.appGate.rbac.models.AuditLog;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.AuditLogRepository;
import com.appGate.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void logAccess(Long userId, String username, String endpoint, String httpMethod, String ipAddress) {
        AuditLog auditLog = new AuditLog(userId, username, endpoint, httpMethod, ipAddress);
        auditLogRepository.save(auditLog);
    }

    public void logAccessFromSecurityContext(String endpoint, String httpMethod, String ipAddress) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = null;
        Long userId = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
            if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                username = ((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal()).getUsername();
            }
        }

        if (username != null) {
            Optional<User> user = userRepository.findByEmail(username);
            if (user.isPresent()) {
                userId = user.get().getId();
            }
            AuditLog auditLog = new AuditLog(userId, username, endpoint, httpMethod, ipAddress);
            auditLogRepository.save(auditLog);
        }
    }

    public List<AuditLog> getAuditLogsByUser(Long userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public List<AuditLog> getAuditLogsByEndpoint(String endpoint) {
        return auditLogRepository.findByEndpoint(endpoint);
    }

    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByDateRange(startDate, endDate);
    }

    public List<AuditLog> getAuditLogsByUserAndDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByUserAndDateRange(userId, startDate, endDate);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }
}

package com.appGate.config;

import java.util.Optional;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.appGate.rbac.models.CustomUserDetailImpl;

/**
 * Supplies the current caller's user id to {@code @CreatedBy}/{@code @LastModifiedBy}
 * fields via Spring Data JPA auditing. Empty for anonymous/system-driven writes,
 * which leaves those fields null rather than stamping a fake id.
 */
@Component("auditorProvider")
public class AuditorAwareImpl implements AuditorAware<Long> {

    @Override
    public Optional<Long> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetailImpl user)) {
            return Optional.empty();
        }
        return Optional.of(user.getId());
    }
}
